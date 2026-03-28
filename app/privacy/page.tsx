'use client'
import NavBar from '@/components/NavBar'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '8px', marginTop: 0 }}>PRIVACY POLICY</h2>
        <p style={{ color: '#8BA5C0', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>Last updated: March 27, 2026</p>

        <div style={{ color: '#2C4A6E', fontSize: '15px', lineHeight: 1.8 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>1. Information We Collect</h3>
          <p style={{ marginBottom: '24px' }}>When you create an account, we collect your email address and authentication credentials. When you use the Service, we collect the concert check-ins, notes, photos, and other content you choose to save.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>2. How We Use Your Information</h3>
          <p style={{ marginBottom: '24px' }}>We use your information to provide and improve the Service, display your saved shows and memories, enable sharing features you initiate, and communicate with you about your account.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>3. Data Storage</h3>
          <p style={{ marginBottom: '24px' }}>Your data is stored securely using Supabase, a hosted database platform. Photos you upload are stored in cloud storage and are accessible via the URLs generated at upload time.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>4. Sharing</h3>
          <p style={{ marginBottom: '24px' }}>We do not sell or share your personal information with third parties for marketing purposes. Concert pages you share via link are publicly accessible. Your show history is private to your account unless you choose to share it.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>5. Third-Party Services</h3>
          <p style={{ marginBottom: '24px' }}>We use Setlist.fm, Archive.org, Ticketmaster, and eBay APIs to enhance your experience. When you interact with these features, your queries (artist names, dates) may be sent to those services. We encourage you to review their privacy policies.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>6. Data Deletion</h3>
          <p style={{ marginBottom: '24px' }}>You can delete individual shows, memories, and photos from within the app at any time. To delete your entire account and all associated data, contact us at warden@dogsname.com.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>7. Cookies</h3>
          <p style={{ marginBottom: '24px' }}>Moonhead uses essential cookies and local storage for authentication purposes only. We do not use tracking cookies or third-party analytics.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>8. Children</h3>
          <p style={{ marginBottom: '24px' }}>Moonhead is not directed at children under 13. We do not knowingly collect information from children under 13.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>9. Changes</h3>
          <p style={{ marginBottom: '24px' }}>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the Service.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>10. Contact</h3>
          <p style={{ marginBottom: '24px' }}>For privacy-related questions, contact us at warden@dogsname.com.</p>
        </div>
      </div>
    </div>
  )
}
