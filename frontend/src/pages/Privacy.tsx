import { Box, Container, Divider, Paper, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/common/PageHeader';
import RedStarField from '../components/common/RedStarField';

const Privacy = () => {
  const [searchParams] = useSearchParams();
  const fromModal = searchParams.get('fromModal') === 'true';

  // Starfield logic
  const mainContentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);
  useEffect(() => {
    const updateHeight = () => {
      if (mainContentRef.current) {
        setContentHeight(mainContentRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Handle closing window when opened from modal
  useEffect(() => {
    if (fromModal) {
      const handlePopState = () => {
        // Check if there's history to go back to
        if (window.history.length <= 1) {
          window.close();
        }
      };

      // Listen for browser back button
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [fromModal]);

  const handleBackClick = () => {
    if (fromModal) {
      // If opened from modal, try to close the window
      // window.close() only works if the window was opened by JavaScript
      if (window.history.length <= 1) {
        window.close();
      } else {
        // If there's history, go back first
        window.history.back();
        // Then close after a short delay if still in the same state
        setTimeout(() => {
          if (window.history.length <= 1) {
            window.close();
          }
        }, 100);
      }
    }
  };

  return (
    <Box
      ref={mainContentRef}
      sx={{ position: 'relative', bgcolor: 'white', width: '100%', overflow: 'hidden' }}
    >
      <RedStarField starCount={2500} contentHeight={contentHeight} />
      <Container sx={{ py: { xs: 8, md: 12 }, position: 'relative', zIndex: 1 }}>
        <Paper
          sx={{
            p: { xs: 3, md: 6 },
            borderRadius: 4,
            maxWidth: 1200,
            mx: 'auto',
            textAlign: 'left',
            backgroundColor: '#fafafa',
            boxShadow: '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
            border: '2px solid',
            borderColor: 'primary.main',
            position: 'relative',
          }}
        >
          <PageHeader
            title="Privacy Policy"
            onBackClick={fromModal ? handleBackClick : undefined}
          />
          <Divider sx={{ mb: 4, borderColor: 'primary.main', opacity: 0.2 }} />
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', color: 'black' }}>
            At AssignmentAI, I take your privacy seriously. This Privacy Policy ("Policy")
            constitutes a legally binding agreement between you ("User," "you," or "your") and
            AssignmentAI ("Company," "I," "me," or "my") regarding the collection, use, disclosure,
            and safeguarding of your information when you access or use my platform. This Policy is
            designed to provide transparency about my data practices and your privacy rights. By
            accessing or using AssignmentAI, you expressly consent to the practices described herein
            and acknowledge that you have read, understood, and agree to be bound by this Policy.
          </Typography>
          {[
            {
              title: '1. Information I Collect',
              content: `I collect and process various categories of information to provide, maintain, and improve my services. This includes, but is not limited to:

          • Personal Identifiable Information (PII):
            - Full name and contact details
            - Email address and associated account information
            - Educational institution affiliation and academic credentials
            - Billing and payment information (processed through secure third-party payment processors)
            - Profile information and preferences
            - Communication records and correspondence

          • Usage and Analytics Data:
            - Platform interaction metrics and session data
            - Feature utilization patterns and preferences
            - Content generation history and usage statistics
            - Time spent on platform and engagement metrics
            - Search queries and navigation patterns
            - Error logs and performance data

          • Technical and Device Information:
            - IP address and geolocation data
            - Browser type, version, and configuration
            - Operating system and device specifications
            - Unique device identifiers and hardware information
            - Network connection details and performance metrics
            - System configuration and security settings

          • Cookies and Tracking Technologies:
            - Essential cookies for platform functionality
            - Authentication and security tokens
            - Performance and analytics cookies
            - Preference and customization cookies
            - Third-party tracking technologies (subject to your consent)
            - Local storage and cache data`,
            },
            {
              title: '2. How I Use Your Information',
              content: `I process your information for various legitimate business purposes, including but not limited to:

          • Service Provision and Enhancement:
            - Delivering and maintaining core platform functionality
            - Personalizing user experience and content delivery
            - Optimizing platform performance and reliability
            - Developing new features and capabilities
            - Conducting quality assurance and testing

          • Communication and Support:
            - Sending service alerts and updates
            - Providing technical support and assistance
            - Responding to inquiries and feedback
            - Sending security alerts and important notices
            - Managing user accounts and preferences

          • Analytics and Improvement:
            - Analyzing usage patterns and trends
            - Measuring platform performance and effectiveness
            - Identifying areas for improvement
            - Conducting user research and surveys
            - Optimizing content and feature delivery

          • Security and Compliance:
            - Preventing fraud and unauthorized access
            - Detecting and addressing security threats
            - Complying with legal obligations
            - Enforcing my terms and policies
            - Protecting my rights and interests`,
            },
            {
              title: '3. Information Sharing and Disclosure',
              content: `I may disclose your information in the following circumstances, subject to appropriate safeguards and confidentiality obligations:

          • Service Providers and Partners:
            - Cloud infrastructure and hosting providers
            - Payment processors and financial institutions
            - Analytics and monitoring services
            - Customer support and communication platforms
            - Security and fraud prevention services
            - All service providers are bound by strict confidentiality agreements

          • Legal and Regulatory Compliance:
            - Response to lawful requests from government authorities
            - Compliance with court orders and legal proceedings
            - Protection of my legal rights and interests
            - Investigation of potential violations
            - Prevention of illegal activities

          • Business Transfers:
            - Mergers, acquisitions, or asset sales
            - Corporate restructuring or reorganization
            - Joint ventures or partnerships
            - All transfers include appropriate privacy protections

          • With Your Consent:
            - When you explicitly authorize disclosure
            - For specific third-party integrations
            - In response to your requests
            - For marketing or promotional purposes

          I maintain strict controls over information sharing and never sell your personal information to third parties.`,
            },
            {
              title: '4. Data Security',
              content: `I implement a comprehensive, multi-layered security framework to protect your information:

          • Technical Safeguards:
            - Industry-standard encryption (AES-256, TLS 1.3)
            - Secure socket layer (SSL) technology
            - Multi-factor authentication systems
            - Intrusion detection and prevention
            - Regular security audits and penetration testing
            - Automated threat monitoring and response

          • Organizational Measures:
            - Strict access controls and authentication
            - Employee security training and awareness
            - Incident response and recovery procedures
            - Regular security assessments and updates
            - Vendor security requirements and audits
            - Data minimization and retention policies

          • Physical Security:
            - Secure data center facilities
            - Environmental controls and monitoring
            - Access control systems
            - Surveillance and monitoring
            - Disaster recovery capabilities
            - Backup and redundancy systems

          While I implement robust security measures, no system is completely secure. I continuously monitor and update my security practices to address emerging threats.`,
            },
            {
              title: '5. Data Retention',
              content: `I maintain a comprehensive data retention framework that balances operational needs with privacy considerations:

          • Retention Periods:
            - Active user data: Retained while account is active
            - Inactive accounts: Reviewed after 24 months of inactivity
            - Transaction records: Retained for 7 years for legal compliance
            - Analytics data: Anonymized after 12 months
            - Communication records: Retained for 2 years
            - Security logs: Retained for 90 days

          • Data Deletion:
            - Upon account closure request
            - After retention period expiration
            - When no longer necessary for stated purposes
            - When required by applicable law
            - When requested by data protection authorities

          • Data Anonymization:
            - Conversion of personal data to anonymous form
            - Removal of identifying characteristics
            - Aggregation of data for analytics
            - Statistical analysis purposes
            - Historical trend analysis

          I regularly review my retention practices to ensure compliance with applicable laws and best practices.`,
            },
            {
              title: '6. Your Rights and Choices',
              content: `Under applicable data protection laws, you may have the following rights:

          • Access and Portability:
            - Right to access your personal information
            - Right to receive data in a structured format
            - Right to transfer data to another service
            - Right to verify data accuracy
            - Right to request data categories
            - Right to receive processing purposes

          • Correction and Deletion:
            - Right to correct inaccurate data
            - Right to complete incomplete data
            - Right to delete personal information
            - Right to restrict processing
            - Right to object to processing
            - Right to withdraw consent

          • Automated Decision Making:
            - Right to human intervention
            - Right to express your point of view
            - Right to contest decisions
            - Right to obtain explanation
            - Right to challenge outcomes
            - Right to request review

          To exercise these rights, please contact my Data Protection Officer at privacy@assignmentai.app. I will respond to your request within 30 days.`,
            },
            {
              title: "7. Children's Privacy",
              content: `I maintain strict compliance with children's privacy protection laws and regulations:

          • Age Restrictions:
            - Platform limited to users 13 years and older
            - Parental consent required for users under 16
            - Age verification procedures
            - Prohibition of child-directed content
            - Regular age verification audits
            - Compliance with COPPA requirements

          • Parental Rights:
            - Right to review child's information
            - Right to request deletion
            - Right to refuse further collection
            - Right to withdraw consent
            - Right to access child's data
            - Right to correct information

          • Protection Measures:
            - Age verification systems
            - Content filtering mechanisms
            - Parental control features
            - Educational content guidelines
            - Regular compliance reviews
            - Staff training on child protection

          I do not knowingly collect or process information from children under 13. If I discover such information, I will promptly delete it.`,
            },
            {
              title: '8. International Data Transfers',
              content: `I maintain a robust framework for international data transfers:

          • Transfer Mechanisms:
            - Standard Contractual Clauses (SCCs)
            - Binding Corporate Rules (BCRs)
            - Adequacy decisions
            - Privacy Shield compliance
            - Data processing agreements
            - Transfer impact assessments

          • Safeguards and Protections:
            - Encryption in transit and at rest
            - Access controls and authentication
            - Data minimization practices
            - Regular security assessments
            - Compliance monitoring
            - Incident response procedures

          • Jurisdiction Compliance:
            - GDPR compliance measures
            - CCPA compliance framework
            - Local data protection laws
            - Cross-border transfer requirements
            - Regulatory reporting
            - Compliance documentation

          I ensure appropriate safeguards are in place for all international data transfers.`,
            },
            {
              title: '9. Changes to This Privacy Policy',
              content: `I maintain a transparent process for policy updates:

          • Update Procedures:
            - Regular policy reviews
            - Legal compliance assessments
            - Industry best practice alignment
            - User feedback consideration
            - Regulatory requirement updates
            - Technology impact evaluation

          • Alert Methods:
            - Platform alerts
            - Email communications
            - Website announcements
            - Account dashboard updates
            - Social media announcements
            - Direct user communications

          • Implementation Timeline:
            - Immediate effect for minor changes
            - 30-day notice for significant changes
            - Phased implementation where appropriate
            - User acknowledgment requirements
            - Opt-out options
            - Grandfathering provisions

          I encourage regular review of this Policy for updates.`,
            },
            {
              title: '10. Contact Us',
              content: `For privacy-related inquiries and requests, please contact me through the following channels:

          • Data Protection Officer:
            Email: privacy@assignmentai.app
            Phone: [Your Privacy Phone Number]
            Address: [Your Business Address]

          • Response Timeframes:
            - Initial response within 48 hours
            - Complete resolution within 30 days
            - Urgent requests prioritized
            - Regular status updates
            - Escalation procedures
            - Complaint resolution process

          • Additional Resources:
            - Privacy FAQ section
            - User guides and documentation
            - Support ticket system
            - Live chat support
            - Community forums
            - Knowledge base

          I am committed to addressing your privacy concerns promptly and effectively.`,
            },
          ].map((section, idx) => (
            <div key={section.title}>
              <Typography
                variant="h5"
                sx={{
                  mt: idx === 0 ? 0 : 5,
                  mb: 1,
                  fontWeight: 600,
                  color: '#D32F2F',
                  letterSpacing: 0.5,
                }}
              >
                {section.title}
              </Typography>
              <Divider sx={{ mb: 2, borderColor: 'primary.main', opacity: 0.12 }} />
              <Typography variant="body2" sx={{ mb: 2, fontSize: '1.08rem', color: 'black' }}>
                {section.content}
              </Typography>
            </div>
          ))}
          <Divider sx={{ my: 4, borderColor: 'primary.main', opacity: 0.12 }} />
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'black' }}>
            Last Updated: 7/16/2025
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Privacy;
