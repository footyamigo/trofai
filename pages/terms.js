import Head from 'next/head';
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Head>
        <title>Terms of Service | TrofAI</title>
        <meta name="description" content="Terms of Service for TrofAI" />
      </Head>
      
      <div className="mb-8">
        <Link href="/">
          <a className="text-blue-600 hover:text-blue-800">← Back to Home</a>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose">
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
        <p className="mb-4">
          Welcome to TrofAI. These Terms of Service govern your use of our website and services. 
          By accessing or using our services, you agree to be bound by these Terms.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">2. Using Our Services</h2>
        <p className="mb-4">
          You must follow any policies made available to you within the Services. You may use our Services only as permitted 
          by law, including applicable export and re-export control laws and regulations. We may suspend or stop providing 
          our Services to you if you do not comply with our terms or policies or if we are investigating suspected misconduct.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">3. Your Account</h2>
        <p className="mb-4">
          You may need an account to use some of our Services. You are responsible for maintaining the security of your account, 
          and you are fully responsible for all activities that occur under your account.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">4. Privacy and Copyright Protection</h2>
        <p className="mb-4">
          Our privacy policies explain how we treat your personal data and protect your privacy when you use our Services. 
          By using our Services, you agree that we can use such data in accordance with our privacy policies.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">5. Your Content in Our Services</h2>
        <p className="mb-4">
          Our Services allow you to upload, submit, store, send or receive content. You retain ownership of any intellectual 
          property rights that you hold in that content. When you upload, submit, store, send or receive content to or through 
          our Services, you give us a worldwide license to use, host, store, reproduce, modify, create derivative works, 
          communicate, publish, publicly perform, publicly display and distribute such content.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">6. Software and Updates</h2>
        <p className="mb-4">
          When a Service requires or includes downloadable software, this software may update automatically on your device once 
          a new version or feature is available. Some Services may let you adjust your automatic update settings.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">7. Modifying and Terminating Our Services</h2>
        <p className="mb-4">
          We are constantly changing and improving our Services. We may add or remove functionalities or features, and we may 
          suspend or stop a Service altogether. You can stop using our Services at any time, although we'll be sorry to see you go. 
          We may also stop providing Services to you, or add or create new limits to our Services at any time.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">8. Liability for Our Services</h2>
        <p className="mb-4">
          To the extent permitted by law, the total liability of TrofAI, and its suppliers and distributors, for any claims 
          under these terms, including for any implied warranties, is limited to the amount you paid us to use the Services.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">9. Business Uses of Our Services</h2>
        <p className="mb-4">
          If you are using our Services on behalf of a business, that business accepts these terms. It will hold harmless and 
          indemnify TrofAI and its affiliates, officers, agents, and employees from any claim, suit or action arising from or 
          related to the use of the Services or violation of these terms, including any liability or expense arising from claims, 
          losses, damages, suits, judgments, litigation costs and attorneys' fees.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">10. About These Terms</h2>
        <p className="mb-4">
          We may modify these terms or any additional terms that apply to a Service to, for example, reflect changes to the law 
          or changes to our Services. You should look at the terms regularly. We'll post notice of modifications to these terms 
          on this page. Changes will not apply retroactively and will become effective no sooner than fourteen days after they 
          are posted. However, changes addressing new functions for a Service or changes made for legal reasons will be effective immediately.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">11. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about these Terms, please contact us at:
          <br />
          Email: legal@trofai.com
        </p>
      </div>
    </div>
  );
} 