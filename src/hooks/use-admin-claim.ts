import { useEffect, useState } from 'react'
import { onIdTokenChanged } from 'firebase/auth'
import { auth } from '../firebase'

// Reads the `admin` custom claim off the current user's ID token.
// set-admin-claim.mjs grants the claim; the client must wait for a token
// refresh (next onIdTokenChanged) for it to appear here. Sign-out / sign-in
// always refreshes the token.
export const useAdminClaim = () => {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false)
        setLoading(false)
        return
      }
      try {
        const token = await user.getIdTokenResult()
        setIsAdmin(token.claims.admin === true)
      } catch (err) {
        console.error('admin claim read failed', err)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [])

  return { isAdmin, loading }
}
