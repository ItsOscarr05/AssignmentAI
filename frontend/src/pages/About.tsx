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
import RedStarField from '../components/common/RedStarField';
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
      description: `Leveraging cutting-edge artificial intelligence to provide intelligent assistance. I am dedicated to staying at the forefront of AI research and development, ensuring that AssignmentAI delivers the most advanced, reliable, and ethical solutions to real academic challenges.`,
    },
    {
      icon: <SecurityOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Privacy & Security',
      description: `Ensuring the highest standards of data protection and user privacy. I implement robust security protocols and am transparent about data practices, so users can trust that their information is safe and handled with care.`,
    },
    {
      icon: <SpeedOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Efficiency',
      description: `Streamlining academic workflows to save time and boost productivity. AssignmentAI automates repetitive tasks, organizes assignments, and provides instant feedback, allowing users to focus on what truly matters: learning and growth.`,
    },
    {
      icon: <GroupOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Community',
      description: `Building a supportive network of students and educators. I believe in the power of collaboration and shared knowledge, and I strive to create a welcoming environment where everyone can contribute, learn, and succeed together.`,
    },
    {
      icon: <EmojiObjectsOutlined sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Continuous Improvement',
      description: `Constantly evolving this platform based on user feedback and needs. I listen to our community and am committed to refining and expanding features to better serve the ever-changing landscape of education.`,
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
            backgroundColor: '#fafafa',
            boxShadow: '0 0 32px rgba(211, 47, 47, 0.4), 0 0 64px rgba(211, 47, 47, 0.3)',
            border: '2px solid',
            borderColor: 'primary.main',
            position: 'relative',
          }}
        >
          <PageHeader title="About AssignmentAI" />
          <Divider sx={{ mb: 3, borderColor: 'primary.main', opacity: 0.2 }} />

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#D32F2F' }}>
            Our Mission
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', color: 'black' }}>
            AssignmentAI was born from a simple yet powerful vision: to democratize access to
            intelligent academic assistance. I believe that every student deserves the opportunity
            to excel in their educational journey, regardless of their background or circumstances.
            <br />
            <br />
            My mission is to provide cutting-edge AI-powered tools that enhance learning, improve
            writing skills, and foster critical thinking. I strive to create an inclusive platform
            that supports diverse learning styles and academic needs.
            <br />
            <br />
            By combining the power of artificial intelligence with human-centered design, I aim to
            transform the way students approach their assignments, making learning more engaging,
            efficient, and effective.
          </Typography>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#D32F2F' }}>
            Our Story
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', color: 'black' }}>
            Founded by a single James Madison University freshman who experienced firsthand the
            challenges of academic writing and research, AssignmentAI emerged from the recognition
            that paying students are forced to do mundane, repetitive work just to graduate.
            <br />
            <br />
            It started with a simple question: "How can I leverage technology to eliminate the
            tedious tasks that don't contribute to real learning?" This question led to developing
            innovative AI solutions that not only assist with writing but also free students from
            unnecessary busywork so they can focus on what truly matters.
            <br />
            <br />
            The journey from a dorm room idea to a fully realized application is a testament to the
            belief that meaningful change can start with a single voice—and that technology can help
            reshape the educational experience for the better. Developed entirely independently
            without any outside help, this project represents the power of individual determination
            and the potential for one person to make a significant impact in educational technology.
          </Typography>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#D32F2F' }}>
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
                    backgroundColor: 'white',
                    borderRadius: 4,
                    border: '2.5px solid #D32F2F',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-6px) scale(1.03)',
                      boxShadow: '0 0 32px rgba(211, 47, 47, 0.3), 0 0 64px rgba(255, 82, 82, 0.2)',
                    },
                  }}
                >
                  {value.icon}
                  <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 600, color: 'black' }}>
                    {value.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666666' }}>
                    {value.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#D32F2F' }}>
            Our Commitment
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, fontSize: '1.15rem', color: 'black' }}>
            I am committed to continuous innovation, user privacy, and educational excellence. This
            platform evolves based on real user feedback, ensuring that it remains at the forefront
            of educational technology while maintaining the highest standards of security and
            ethical AI use.
            <br />
            <br />I believe in open communication and transparency. I'm always ready to assist, and
            I value every piece of feedback as an opportunity to grow. I am dedicated to building
            trust with users by being responsive, honest, and proactive in addressing concerns.
            AssignmentAI is more than a tool—it's a promise to support your academic journey every
            step of the way.
          </Typography>

          <Typography variant="h5" sx={{ mb: 1, fontWeight: 600, color: '#D32F2F' }}>
            Join Our Journey
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.15rem', color: 'black' }}>
            Whether you're a student looking to improve your academic performance, an educator
            seeking innovative teaching tools, or an institution aiming to enhance learning
            outcomes, AssignmentAI is here to support your educational journey.
            <br />
            <br />I invite you to connect with me, share your experiences, and help shape the future
            of AssignmentAI. Participate in our community forums, attend our webinars, or contribute
            your ideas for new features. Together, we can create a smarter, more inclusive, and more
            effective educational environment for everyone.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default About;
