import {createCertificate, type CertificateCreationOptions, type CertificateCreationResult} from 'pem'

export async function makeCertificate(options: CertificateCreationOptions): Promise<CertificateCreationResult> {
  return new Promise((resolve, reject) => {
    createCertificate(options, (error, result) => {
      if (error) reject(error)
      else resolve(result)
    })
  })
}
