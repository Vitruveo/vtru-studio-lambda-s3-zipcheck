# Introduction

A simple service for validate zip files.

## Deploy

### Production

```bash
sls deploy -s production --param="NOTIFY_API_URL=https://studio-api.vitruveo.xyz"
```

### Quality Assuarance

```bash
sls deploy -s qa --param="NOTIFY_API_URL=https://api.vtru.dev"
```
