# QR code

`site.svg` encodes: <http://localhost:3210/>

Regenerate whenever the domain changes:

```bash
node scripts/generate-qr.mjs http://localhost:3210/
```

Print it for the counter, the bill book and the Google Business Profile.
It opens the home page; do not encode a product or rate page, which change.
