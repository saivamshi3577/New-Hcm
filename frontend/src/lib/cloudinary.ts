// Cloudinary Integration Utility
export const CLOUDINARY_CONFIG = {
  cloudName: 'bsr9ntoc',
  apiKey: '233362255129786',
  uploadPreset: 'FusionHRMS',
}




export type CloudinaryFolder = 
  | 'logos' 
  | 'avatars' 
  | 'documents' 
  | 'resumes' 
  | 'attachments' 
  | 'general' 
  | string

/**
 * Uploads an image or document directly to Cloudinary into the designated folder.
 * 
 * Target Cloudinary folder hierarchy:
 * - HRMS/logos          -> Company branding & tenant logos created by Super Admin / Admin
 * - HRMS/avatars        -> Employee, HR, and Manager profile photos
 * - HRMS/documents      -> Employee verification files, ID proofs, offer letters, policies
 * - HRMS/resumes        -> Candidate resumes & recruitment files
 * - HRMS/attachments    -> Task & project sprint attachments
 */
export async function uploadToCloudinary(
  fileOrBase64: File | Blob | string,
  folderType: CloudinaryFolder = 'logos'
): Promise<string> {
  const cleanFolder = folderType.startsWith('HRMS/') ? folderType : `HRMS/${folderType}`
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`

  // 1. Direct Cloudinary Upload via Unsigned Preset
  try {
    const formData = new FormData()
    formData.append('file', fileOrBase64)
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset)
    formData.append('folder', cleanFolder)

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok && data.secure_url) {
      return data.secure_url
    }

    if (data?.error?.message) {
      console.warn('Direct Cloudinary response error:', data.error.message)
      throw new Error(data.error.message)
    }
  } catch (cloudErr: any) {
    console.warn('Direct Cloudinary upload failed, attempting backend upload:', cloudErr.message)

    // 2. Fallback: Server-side Cloudinary Upload Route
    try {
      let base64String = ''

      if (typeof fileOrBase64 === 'string') {
        base64String = fileOrBase64
      } else {
        base64String = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(fileOrBase64)
        })
      }

      const { api } = await import('./api')
      const res: any = await api.post('/upload', {
        file: base64String,
        folder: folderType,
      })

      if (res?.secure_url || res?.url) {
        return res.secure_url || res.url
      }

      throw new Error(res?.details || res?.error || 'Cloudinary upload failed')
    } catch (serverErr: any) {
      console.error('All Cloudinary upload attempts failed:', serverErr)
      throw new Error(
        cloudErr.message || serverErr.message || 'Failed to upload to Cloudinary.'
      )
    }
  }

  throw new Error('Could not upload image to Cloudinary.')
}

/** Convenience uploaders for specific entity categories */
export const uploadCompanyLogo = (file: File | Blob | string) => uploadToCloudinary(file, 'logos')
export const uploadUserAvatar = (file: File | Blob | string) => uploadToCloudinary(file, 'avatars')
export const uploadDocumentFile = (file: File | Blob | string) => uploadToCloudinary(file, 'documents')
export const uploadTaskAttachment = (file: File | Blob | string) => uploadToCloudinary(file, 'attachments')
