
import api from './api'

// --------------------------------------------------
// GET CURRENT USER PROFILE
// --------------------------------------------------

// Retrieve the authenticated user's personal profile.
export const getMyProfile = async () => {
  const response = await api.get('/auth/me')

  return response.data
}


// --------------------------------------------------
// UPDATE CURRENT USER PROFILE
// --------------------------------------------------

// Update the authenticated user's personal information.
export const updateMyProfile = async (profileData) => {
  const response = await api.put(
    '/auth/me',
    profileData
  )

  return response.data
}


// --------------------------------------------------
// UPLOAD OR REPLACE PROFILE PICTURE
// --------------------------------------------------

// Upload a new profile picture or replace an existing one.
export const uploadMyAvatar = async (file) => {
  const formData = new FormData()

  formData.append('avatar', file)

  // Axios automatically sets the multipart Content-Type
  // and includes the correct boundary.
  const response = await api.post(
    '/auth/me/avatar',
    formData
  )

  return response.data
}


// --------------------------------------------------
// REMOVE PROFILE PICTURE
// --------------------------------------------------

// Delete the authenticated user's existing profile picture.
export const removeMyAvatar = async () => {
  const response = await api.delete(
    '/auth/me/avatar'
  )

  return response.data
}


// --------------------------------------------------
// RETRIEVE PRIVATE PROFILE PICTURE
// --------------------------------------------------

// Retrieve the avatar as a Blob because the endpoint
// requires JWT authentication.
//
// The Axios interceptor automatically attaches
// the Authorization: Bearer <token> header.
export const getMyAvatarBlob = async () => {
  const response = await api.get(
    '/auth/me/avatar',
    {
      responseType: 'blob',
    }
  )

  return response.data
}
