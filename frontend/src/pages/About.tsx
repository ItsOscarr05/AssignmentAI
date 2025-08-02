import {
  AutoAwesomeOutlined,
  EmojiObjectsOutlined,
  GroupOutlined,
  SchoolOutlined,
  SecurityOutlined,
  SpeedOutlined,
} from '@mui/icons-material';
import { Box, Container, Divider, Grid, Paper, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import RedStarField from '../components/RedStarField';
import PageHeader from '../components/common/PageHeader';

const About = () => {
  const values = [
    {
      icon: <SchoolOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Educational Excellence',
      description: `We're committed to enhancing the learning experience through innovative AI technology. We believe that education is the foundation of personal and societal growth. Our platform is designed to support students and educators in achieving their highest potential, fostering curiosity, critical thinking, and a lifelong love of learning.`,
    },
    {
      icon: <AutoAwesomeOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'AI Innovation',
      description: `Leveraging cutting-edge artificial intelligence to provide intelligent assistance. Our team is dedicated to staying at the forefront of AI research and development, ensuring that AssignmentAI delivers the most advanced, reliable, and ethical solutions to real academic challenges.`,
    },
    {
      icon: <SecurityOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Privacy & Security',
      description: `Ensuring the highest standards of data protection and user privacy. We implement robust security protocols and are transparent about our data practices, so users can trust that their information is safe and handled with care.`,
    },
    {
      icon: <SpeedOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Efficiency',
      description: `Streamlining academic workflows to save time and boost productivity. AssignmentAI automates repetitive tasks, organizes assignments, and provides instant feedback, allowing users to focus on what truly matters: learning and growth.`,
    },
    {
      icon: <GroupOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Community',
      description: `Building a supportive network of students and educators. We believe in the power of collaboration and shared knowledge, and we strive to create a welcoming environment where everyone can contribute, learn, and succeed together.`,
    },
    {
      icon: <EmojiObjectsOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Continuous Improvement',
      description: `Constantly evolving our platform based on user feedback and needs. We listen to our community and are committed to refining and expanding our features to better serve the ever-changing landscape of education.`,
    },
  ];

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
      <Container sx={{ py: { xs: 2, md: 3 }, position: 'relative', zIndex: 1 }}>
        <Paper
          sx={{
            p: { xs: 2, md: 4 },
            borderRadius: 4,
            maxWidth: 1200,
            mx: 'auto',
            textAlign: 'left',
            backgroundColor: 'grey.50',
            boxShadow: '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
            border: '2px solid',
            borderColor: 'primary.main',
            position: 'relative',
          }}
        >
          <PageHeader title="About AssignmentAI" />
          <Divider sx={{ mb: 3, borderColor: 'primary.main', opacity: 0.2 }} />

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            Our Mission
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', color: 'text.secondary' }}>
            AssignmentAI was born from a simple yet powerful vision: to democratize access to
            intelligent academic assistance. We believe that every student deserves the opportunity
            to excel in their educational journey, regardless of their background or circumstances.
            <br />
            <br />
            Our mission is to provide cutting-edge AI-powered tools that enhance learning, improve
            writing skills, and foster critical thinking. We strive to create an inclusive platform
            that supports diverse learning styles and academic needs.
            <br />
            <br />
            By combining the power of artificial intelligence with human-centered design, we aim to
            transform the way students approach their assignments, making learning more engaging,
            efficient, and effective.
          </Typography>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            Our Story
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', color: 'text.secondary' }}>
            Founded by a team of educators, technologists, and students who experienced firsthand
            the challenges of academic writing and research, AssignmentAI emerged from the
            recognition that traditional study methods often fall short in today's fast-paced,
            information-rich world.
            <br />
            <br />
            We started with a simple question: "How can we leverage technology to make learning more
            accessible and effective?" This question led us to develop innovative AI solutions that
            not only assist with writing but also teach valuable skills that last a lifetime.
            <br />
            <br />
            The journey from a dorm room idea to a fully realized application is a testament to the
            belief that meaningful change can start with a single voice—and that technology can help
            reshape the educational experience for the better.
          </Typography>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            Our Values
          </Typography>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {values.map((value, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Box
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    backgroundColor: 'background.paper',
                    borderRadius: 4,
                    boxShadow: 3,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-6px) scale(1.03)',
                      boxShadow: '0 0 32px rgba(211, 47, 47, 0.3), 0 0 64px rgba(255, 82, 82, 0.2)',
                    },
                  }}
                >
                  {value.icon}
                  <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {value.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            Our Commitment
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', color: 'text.secondary' }}>
            We are committed to continuous innovation, user privacy, and educational excellence. Our
            platform evolves based on real user feedback, ensuring that we remain at the forefront
            of educational technology while maintaining the highest standards of security and
            ethical AI use.
            <br />
            <br />
            We believe in open communication and transparency. Our support team is always ready to
            assist, and we value every piece of feedback as an opportunity to grow. We are dedicated
            to building trust with our users by being responsive, honest, and proactive in
            addressing concerns. AssignmentAI is more than a tool—it's a promise to support your
            academic journey every step of the way.
          </Typography>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
            Join Our Journey
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.15rem', color: 'text.secondary' }}>
            Whether you're a student looking to improve your academic performance, an educator
            seeking innovative teaching tools, or an institution aiming to enhance learning
            outcomes, AssignmentAI is here to support your educational journey.
            <br />
            <br />
            We invite you to connect with us, share your experiences, and help shape the future of
            AssignmentAI. Participate in our community forums, attend our webinars, or contribute
            your ideas for new features. Together, we can create a smarter, more inclusive, and more
            effective educational environment for everyone.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default About;
