import { Box, Container, Divider, Link, Paper, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import RedStarField from '../components/RedStarField';
import PageHeader from '../components/common/PageHeader';

const Terms = () => {
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

  return (
    <Box
      ref={mainContentRef}
      sx={{ position: 'relative', bgcolor: 'white', width: '100%', overflow: 'hidden' }}
    >
      <RedStarField starCount={2500} contentHeight={contentHeight} />
      <Container sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 1 }}>
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
          <PageHeader title="Terms of Service" />
          <Divider sx={{ mb: 4, borderColor: 'primary.main', opacity: 0.2 }} />
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', color: 'black' }}>
            Welcome to AssignmentAI. By accessing or using our platform, you acknowledge and agree
            to be legally bound by these Terms of Service ("Terms"). These Terms constitute a
            binding agreement between you (the "User") and AssignmentAI (the "Company"). Please read
            them carefully before using our services. If you do not agree to these Terms, you must
            not use AssignmentAI.
          </Typography>
          {[
            {
              title: '1. Acceptance of Terms',
              content: `By accessing, browsing, or otherwise using AssignmentAI, you represent and warrant that you have read, understood, and agree to be bound by these Terms, as well as any additional guidelines, policies, or rules that may be posted on the platform from time to time. Your continued use of AssignmentAI constitutes your acceptance of any modifications to these Terms.`,
            },
            {
              title: '2. Academic Integrity & Responsibility',
              content: `You agree to use AssignmentAI in compliance with all applicable laws, regulations, and institutional policies, including but not limited to your school, college, or university's code of conduct or honor code. You acknowledge and accept full responsibility for your use of the platform and any consequences thereof. AssignmentAI disclaims any and all liability for academic penalties, disciplinary actions, or other consequences arising from your use of the platform in violation of institutional or legal requirements. You expressly agree to indemnify and hold harmless AssignmentAI, its affiliates, officers, employees, and agents from any claims, damages, or liabilities resulting from your misuse of the platform.`,
            },
            {
              title: '3. Eligibility',
              content: `AssignmentAI is intended solely for individuals who are at least thirteen (13) years of age. By using the platform, you represent and warrant that you meet this age requirement and that all information you provide to AssignmentAI is truthful and accurate. AssignmentAI reserves the right to request proof of age at any time and to suspend or terminate accounts where eligibility is in doubt. If you are using AssignmentAI on behalf of an organization or another individual, you represent and warrant that you have the authority to bind that entity or person to these Terms, and that all provisions herein apply to both you and the entity or person you represent. If you do not meet these requirements, you must not access or use AssignmentAI.`,
            },
            {
              title: '4. User Accounts',
              content: `You are solely responsible for maintaining the confidentiality and security of your account credentials, including your username and password. You agree to provide accurate, current, and complete information during registration and to promptly update such information as necessary. You are fully responsible for all activities that occur under your account. AssignmentAI reserves the right to suspend or terminate your account at its sole discretion, with or without notice, for any reason, including but not limited to violation of these Terms.`,
            },
            {
              title: '5. Acceptable Use',
              content: `You agree not to use AssignmentAI for any unlawful, fraudulent, or malicious purpose, or in any manner that could damage, disable, overburden, or impair the platform. Prohibited conduct includes, but is not limited to: (a) violating any applicable law or regulation; (b) infringing the intellectual property or other rights of any third party; (c) transmitting any viruses, malware, or other harmful code; (d) engaging in harassment, abuse, or threats; (e) attempting to gain unauthorized access to any part of the platform or its systems; or (f) interfering with the proper functioning of AssignmentAI.`,
            },
            {
              title: '6. Intellectual Property',
              content: `All content, features, and functionality on AssignmentAI, including but not limited to text, graphics, logos, icons, images, software, and data, are the exclusive property of AssignmentAI or its licensors and are protected by copyright, trademark, and other intellectual property laws. You are granted a limited, non-exclusive, non-transferable, and revocable license to access and use the platform for personal, non-commercial purposes only. Any unauthorized use, reproduction, or distribution of content is strictly prohibited.`,
            },
            {
              title: '7. AI Content and Limitations',
              content: `AssignmentAI provides AI-generated content and suggestions for informational and educational purposes only. The Company makes no representations or warranties regarding the accuracy, completeness, reliability, or suitability of any AI-generated output. You acknowledge that reliance on any information provided by AssignmentAI is at your own risk. The Company expressly disclaims any liability for errors or omissions in the AI-generated content.`,
            },
            {
              title: '8. Privacy',
              content: `Your privacy is important to us. AssignmentAI may collect, use, store, and process various types of information, including but not limited to personal information, usage data, device information, and communications with the platform. By using AssignmentAI, you consent to the collection, processing, storage, and transfer of your information, which may occur in jurisdictions outside your own. AssignmentAI implements reasonable administrative, technical, and physical safeguards to protect your information, but cannot guarantee absolute security. Your use of the platform is also governed by our Privacy Policy, which is incorporated by reference into these Terms. You may have certain rights under applicable privacy laws, including the right to access, correct, or delete your personal information, subject to legal and operational requirements. By using the platform, you consent to the practices described in the Privacy Policy and these Terms.`,
            },
            {
              title: '9. Termination',
              content: `AssignmentAI reserves the right, in its sole discretion and without notice or liability, to suspend, restrict, or terminate your access to the platform at any time and for any reason, including but not limited to violation of these Terms, suspected fraud, or conduct that AssignmentAI believes is harmful to other users, the platform, or third parties. Upon termination, all rights granted to you under these Terms will immediately cease. AssignmentAI may, but is not obligated to, delete or retain your account information and any content or data associated with your account, subject to applicable law and operational requirements. You may terminate your own account at any time by following the instructions on the platform; however, certain data may be retained for legal, regulatory, or legitimate business purposes. AssignmentAI shall not be liable to you or any third party for any termination of your access to the platform or for the deletion or retention of your data.`,
            },
            {
              title: '10. Disclaimers and Limitation of Liability',
              content: `ASSIGNMENTAI IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. TO THE MAXIMUM EXTENT PERMITTED BY LAW, ASSIGNMENTAI AND ITS AFFILIATES, OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM (A) YOUR USE OR INABILITY TO USE THE PLATFORM; (B) ANY UNAUTHORIZED ACCESS TO OR USE OF OUR SERVERS AND/OR ANY PERSONAL INFORMATION STORED THEREIN; OR (C) ANY OTHER MATTER RELATING TO THE PLATFORM.`,
            },
            {
              title: '11. Changes to Terms',
              content: `AssignmentAI reserves the right to modify, amend, or update these Terms at any time, in its sole discretion. Any changes will be effective immediately upon posting on the platform. Your continued use of AssignmentAI after such changes constitutes your acceptance of the revised Terms. It is your responsibility to review these Terms periodically.`,
            },
          ].map((section, idx) => (
            <div key={section.title}>
              <Typography
                variant="h5"
                sx={{
                  mt: idx === 0 ? 0 : 5,
                  mb: 1,
                  fontWeight: 600,
                  color: 'primary.main',
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
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: '#666666' }}>
            If you have any questions or concerns about these Terms, please{' '}
            <Link
              component={RouterLink}
              to="/contact"
              sx={{
                color: '#D32F2F',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              contact us
            </Link>{' '}
            at support@assignmentai.app.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Terms;
