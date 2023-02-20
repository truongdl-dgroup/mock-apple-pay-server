# Instructions

## Setup Apple Pay (account & certificates)

1.  Configure merchant ID

    1. In Certificates, Identifiers & Profiles, click Identifiers in the sidebar, then click the add button (+) on the top left
    1. Select Merchant IDs, then click Continue
    1. Enter the merchant description and identifier name, then click Continue
    1. Review the settings, then click Register.

1.  Configure merchant ID certificate

    1. In Certificates, Identifiers & Profiles, click Identifiers in the sidebar, Open Identifiers dropdown (default should be App IDs) and go to Merchant IDs.
    1. Select correct merchant id you just created in the session above.
    1. Click `Create Certificate` under `Apple Pay Merchant Identity Certificate`
    1. Upload a Certificate Signing Request file (`.csr`)
       Following [theses steps](https://developer.apple.com/help/account/create-certificates/create-a-certificate-signing-request).
    1. Download you new certificate (`.cer`) file.
    1. Then please go to the [## Developer needs](#developer-needs) and generate correct `.p12` format for us (developers).

1.  Create a payment processing certificate

    1.  In `Certificates, Identifiers & Profiles`, click `Identifiers` in the sidebar
    1.  Under `Identifiers`, select Merchant IDs using he filter on the top right
    1.  On the right , select you merchant identifier
    1.  Under `Apple Pay Payment Processing Certificate`, click `Create Certificate`
    1.  Create a certificate signing request on you Mac, the click Continue
    1.  Click Choose File
    1.  In the dialog that appears, select the certificate request file (a file with a `.certSigningRequest` file extension) then click Continue
    1.  Click Continue
    1.  Click Download
        > The certificate file (a file with `.cer` file extension) appears in your Downloads folder

1.  Verify your domains

## Developer needs

1. For the validate and request new merchant payment session

   1. Merchant ID: uses for validate merchant and decrypt payment token
      > Ex: `merchant.com.example.petavenue`
   1. The Merchant Identity Certificate (`.p12`)

      - This certificate is different from Apple Pay certificate.
      - Make sure you have verified your domain name.
      - Once completed, you should have a certificate you can download (`.cer`) and add to Keychain Access (on you mac)
      - Find certificate in `Keychain Access`
      - Right click and export the certificate to Personal Information Exchange (`.p12`) format.
      - Apple will asks you to pick a passphrase, if you pick a passphrase, please also send to us (the developers) the passphrase, we need the passphrase to convert it to `.pem` file.
        > Ex: `merchant_id.p12`

1. For the decrypt payment token

   > This is the same with Merchant ID certificate in the session above.

   > We need the `.p12` file for payment processing certificate for validation and authorization.
