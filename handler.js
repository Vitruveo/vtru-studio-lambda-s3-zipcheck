// This function is triggered by an S3 event and checks if there are any blacklisted files in the uploaded zip file.
const axios = require('axios');
const admzip = require('adm-zip');
const s3client = require('@aws-sdk/client-s3');
const cryto = require('crypto');
const fs = require('fs/promises');

const blackList = [
    'exe',
    'com',
    'dll',
    'zip',
    'tar',
    'gz',
    'ps1',
    'bat',
    'deb',
    'rpm',
    'apk',
    'msi',
    'dmg',
    'iso',
    'img',
    'jar',
    'war',
    'ear',
    'tgz',
    'bz2',
    '7z',
    'rar',
];

const notify = async ({ filename }) => {
    const url = `${process.env.NOTIFY_API_URL}/assets/notify/file`;
    const data = { filename };

    try {
        const response = await axios.post(url, data);
        console.log(`Status: ${response.status}`);
        console.log('Body: ', response.data);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

const md5hash = (value) => cryto.createHash('md5').update(value).digest('hex');

const checkFile = async ({ filename, bucket, region }) => {
    const s3 = new s3client.S3Client({ region });
    const params = {
        Bucket: bucket,
        Key: filename,
    };
    const data = await s3.send(new s3client.GetObjectCommand(params));

    // write file on disk
    const tempFile = `/tmp/${md5hash(filename)}.zip`;
    await fs.writeFile(tempFile, data.Body);

    // open the file and get entries
    const zip = new admzip(tempFile);
    const list = zip.getEntries();

    // check is there any blacklisted file
    const blacklisted = list.some((entry) =>
        blackList.some((ext) => entry.entryName.endsWith(`.${ext}`))
    );

    if (blacklisted) {
        console.log('Blacklisted file found', {
            filename,
            bucket,
            region,
        });

        // remove file from s3
        await s3.send(new s3client.DeleteObjectCommand(params));
        await notify({ filename, bucket, region });
    }
};

module.exports.postprocess = async (event) => {
    await Promise.all(
        event.Records.map((record) =>
            checkFile({
                filename: record.s3.object.key,
                bucket: record.s3.bucket.name,
                region: record.awsRegion,
            })
        )
    );
};
