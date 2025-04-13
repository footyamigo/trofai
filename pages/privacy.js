import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Head>
        <title>Privacy Policy | TrofAI</title>
        <meta name="description" content="Privacy Policy for TrofAI" />
      </Head>
      
      <div className="mb-8">
        <Link href="/">
          <a className="text-blue-600 hover:text-blue-800">← Back to Home</a>
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose">
        <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
        <p className="mb-4">
          Welcome to TrofAI. We respect your privacy and are committed to protecting your personal data. 
          This privacy policy will inform you about how we look after your personal data when you visit our website
          and tell you about your privacy rights and how the law protects you.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">2. Data We Collect</h2>
        <p className="mb-4">
          We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>Identity Data: includes name, username or similar identifier</li>
          <li>Contact Data: includes email address</li>
          <li>Technical Data: includes internet protocol (IP) address, browser type and version, time zone setting and location, 
              browser plug-in types and versions, operating system and platform, and other technology on the devices you use to access this website</li>
          <li>Usage Data: includes information about how you use our website and services</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">3. How We Use Your Data</h2>
        <p className="mb-4">
          We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>To provide you with our services</li>
          <li>To improve our website and services</li>
          <li>To communicate with you</li>
          <li>To comply with a legal or regulatory obligation</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">4. Data Security</h2>
        <p className="mb-4">
          We have put in place appropriate security measures to prevent your personal data from being accidentally lost, 
          used or accessed in an unauthorized way, altered or disclosed. In addition, we limit access to your personal data 
          to those employees, agents, contractors and other third parties who have a business need to know.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">5. Data Retention</h2>
        <p className="mb-4">
          We will only retain your personal data for as long as necessary to fulfill the purposes we collected it for, 
          including for the purposes of satisfying any legal, accounting, or reporting requirements.
        </p>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">6. Your Legal Rights</h2>
        <p className="mb-4">
          Under certain circumstances, you have rights under data protection laws in relation to your personal data, including:
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>The right to access your personal data</li>
          <li>The right to correction of your personal data</li>
          <li>The right to erasure of your personal data</li>
          <li>The right to object to processing of your personal data</li>
          <li>The right to restrict processing of your personal data</li>
          <li>The right to data portability</li>
        </ul>
        
        <h2 className="text-xl font-semibold mt-6 mb-3">7. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this privacy policy or our privacy practices, please contact us at:
          <br />
          Email: privacy@trofai.com
        </p>
      </div>
    </div>
  );
} 