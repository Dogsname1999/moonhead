'use client'
import NavBar from '@/components/NavBar'

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F0E8' }}>
      <NavBar backLabel="Home" backPath="/" />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '36px 24px 64px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.1em', color: '#2C4A6E', marginBottom: '8px', marginTop: 0 }}>TERMS OF SERVICE</h2>
        <p style={{ color: '#8BA5C0', fontSize: '14px', marginBottom: '32px', marginTop: 0 }}>Last updated: March 27, 2026</p>

        <div style={{ color: '#2C4A6E', fontSize: '15px', lineHeight: 1.8 }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>1. Acceptance of Terms</h3>
          <p style={{ marginBottom: '24px' }}>By accessing or using Moonhead ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>2. Description of Service</h3>
          <p style={{ marginBottom: '24px' }}>Moonhead is a concert check-in and memory platform that allows users to log shows they have attended, build dream show collections, save setlists, upload photos, and share concert experiences.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>3. User Accounts</h3>
          <p style={{ marginBottom: '24px' }}>You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account. You are responsible for all activity that occurs under your account.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>4. User Content</h3>
          <p style={{ marginBottom: '24px' }}>You retain ownership of content you upload to Moonhead, including photos and notes. By uploading content, you grant Moonhead a non-exclusive license to display that content within the Service. You agree not to upload content that is illegal, harmful, or infringes on the rights of others.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>5. Acceptable Use</h3>
          <p style={{ marginBottom: '24px' }}>You agree not to misuse the Service, including but not limited to: attempting to gain unauthorized access, interfering with other users, uploading malicious content, or using the Service for any unlawful purpose.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>6. Third-Party Services</h3>
          <p style={{ marginBottom: '24px' }}>Moonhead integrates with third-party services including Setlist.fm, Archive.org, Ticketmaster, and eBay. Your use of data from these services is subject to their respective terms.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>7. Disclaimer</h3>
          <p style={{ marginBottom: '24px' }}>The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy of setlist data, show information, or availability of third-party content.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>8. Changes to Terms</h3>
          <p style={{ marginBottom: '24px' }}>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>

          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#2C4A6E', marginBottom: '12px' }}>9. Contact</h3>
          <p style={{ marginBottom: '24px' }}>For questions about these Terms, contact us at warden@dogsname.com.</p>
        </div>
      </div>
    </div>
  )
}
