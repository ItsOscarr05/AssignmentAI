<Box
  sx={{
    minHeight: '80vh',
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    alignItems: 'center',
    justifyContent: 'space-between',
    bgcolor: 'background.paper',
    px: 4,
    py: 8,
    position: 'relative',
  }}
>
  <Box sx={{ maxWidth: 500 }}>
    <Typography variant="h2" fontWeight="bold" gutterBottom>
      We Help You With <br />
      <span style={{ color: '#1976d2' }}>Homework.</span>
    </Typography>
    <Typography variant="h5" color="text.secondary" gutterBottom>
      Stressed About Homework? Let Us Finish it Fast. Get Detailed Answers 10X Faster!
    </Typography>
    <Stack direction="row" spacing={2} mt={4}>
      <Button variant="contained" size="large">
        Sign Up Today
      </Button>
      <Button variant="outlined" size="large">
        See Features
      </Button>
    </Stack>
    <Stack direction="row" spacing={4} mt={4}>
      <Box>
        <Typography variant="h4" fontWeight="bold">
          4.8/5
        </Typography>
        <Typography variant="body2">Rated by Students</Typography>
      </Box>
      <Box>
        <Typography variant="h4" fontWeight="bold">
          500K+
        </Typography>
        <Typography variant="body2">Active Users</Typography>
      </Box>
      <Box>
        <Typography variant="h4" fontWeight="bold">
          20M+
        </Typography>
        <Typography variant="body2">Words Generated</Typography>
      </Box>
    </Stack>
  </Box>
  <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
    {/* Place for illustration, device mockup, or animation */}
    <img
      src="/images/ai-hero-illustration.svg"
      alt="AI Illustration"
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  </Box>
</Box>

<Box sx={{ py: 8, bgcolor: 'background.default' }}>
  <Container>
    <Typography variant="h3" align="center" gutterBottom>
      What Can You Generate With AssignmentAI?
    </Typography>
    <Typography variant="h6" align="center" color="text.secondary" paragraph>
      Our AI is trained by experts in content creation and conversions. With the help of this homework AI solver, students don't have to struggle to do their homework. Say goodbye to homework stress! Get quick, complimentary assistance now!
    </Typography>
    <Grid container spacing={4} mt={4}>
      {[
        { title: 'Assignment Expert', description: 'Use Assignment AI for quick and accurate answers to study questions. Essential for students striving for high grades.', icon: '📚' },
        { title: 'Grammar Guru', description: 'Improve your writing with instant grammar, style, and punctuation suggestions. Ideal for crafting flawless essays and emails.', icon: '✍️' },
        { title: 'Diagram Maker', description: 'Easily generate diagrams and charts to visually represent data and concepts, making complex information clear and engaging.', icon: '📊' },
        { title: 'Image to Answer', description: 'Take a photo of your problem and get the answer instantly – a revolutionary tool for homework and studies.', icon: '📷' },
        { title: 'AI Detector & Humanizer', description: 'AssignmentWriter adds a human touch to AI text, making engaging and relatable content for your audience.', icon: '🤖' },
        { title: 'Creative Code Generator', description: 'Need help with code? Generate unique codes for your projects and seamlessly integrate them into your products.', icon: '💻' },
      ].map((feature, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            <Typography variant="h4" gutterBottom>{feature.icon}</Typography>
            <Typography variant="h5" gutterBottom>{feature.title}</Typography>
            <Typography variant="body1" color="text.secondary" align="center">{feature.description}</Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Container>
</Box>

<Box sx={{ py: 8, bgcolor: 'background.paper' }}>
  <Container>
    <Typography variant="h3" align="center" gutterBottom>
      Why AssignmentAI is Better than ChatGPT?
    </Typography>
    <Grid container spacing={4} mt={4}>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3, height: '100%' }}>
          <Typography variant="h5" gutterBottom>AssignmentAI</Typography>
          <List>
            <ListItem>
              <ListItemIcon>🎓</ListItemIcon>
              <ListItemText primary="Designed for Students and Academia" />
            </ListItem>
            <ListItem>
              <ListItemIcon>🧠</ListItemIcon>
              <ListItemText primary="Superior AI Model Built for Students & Academia" />
            </ListItem>
            <ListItem>
              <ListItemIcon>📖</ListItemIcon>
              <ListItemText primary="Enriched with 20+ Academia Use Cases" />
            </ListItem>
            <ListItem>
              <ListItemIcon>✔</ListItemIcon>
              <ListItemText primary="Specialized Tools: AI Diagram Maker, Bypass AI, Math Solver" />
            </ListItem>
            <ListItem>
              <ListItemIcon>👍</ListItemIcon>
              <ListItemText primary="Real-Time Reference: Answers with Real-Time References" />
            </ListItem>
          </List>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3, height: '100%' }}>
          <Typography variant="h5" gutterBottom>ChatGPT</Typography>
          <List>
            <ListItem>
              <ListItemIcon>🌐</ListItemIcon>
              <ListItemText primary="Designed for General-Purpose" />
            </ListItem>
            <ListItem>
              <ListItemIcon>🤖</ListItemIcon>
              <ListItemText primary="General-Purpose AI Model" />
            </ListItem>
            <ListItem>
              <ListItemIcon>📃</ListItemIcon>
              <ListItemText primary="Limited Academic Focus" />
            </ListItem>
            <ListItem>
              <ListItemIcon>❌</ListItemIcon>
              <ListItemText primary="Specialized Tools: N/A" />
            </ListItem>
            <ListItem>
              <ListItemIcon>👎</ListItemIcon>
              <ListItemText primary="References may not be real-time" />
            </ListItem>
          </List>
        </Card>
      </Grid>
    </Grid>
  </Container>
</Box>

<Box sx={{ py: 8, bgcolor: 'background.default' }}>
  <Container>
    <Typography variant="h3" align="center" gutterBottom>
      Trending Features of AssignmentAI for Modern Students
    </Typography>
    <Typography variant="h6" align="center" color="text.secondary" paragraph>
      Discover the latest trending features of AssignmentAI, a tool designed to elevate modern student's academic experiences. It is the most powerful AI homework helper built to improve the abilities of the students.
    </Typography>
    <Grid container spacing={4} mt={4}>
      {[
        { title: 'Quick Answers From Pictures', description: 'Snap a photo of your homework and get the answer right away. No more scratching your head over tough questions!', icon: '📷' },
        { title: 'Easy Diagram Maker', description: 'Create diagrams for your assignments with just a few clicks. No need for drawing or fancy software.', icon: '📊' },
        { title: 'Math Problem Solver', description: 'Stuck on a math problem? AssignmentAI can solve it for free! Simply upload your problem and receive high-quality, precise answers within seconds.', icon: '🔢' },
      ].map((feature, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
            <Typography variant="h4" gutterBottom>{feature.icon}</Typography>
            <Typography variant="h5" gutterBottom>{feature.title}</Typography>
            <Typography variant="body1" color="text.secondary" align="center">{feature.description}</Typography>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Container>
</Box>

<Box sx={{ py: 8, bgcolor: 'background.paper' }}>
  <Container>
    <Typography variant="h3" align="center" gutterBottom>
      Choose the Perfect Plan for You
    </Typography>
    <Typography variant="h6" align="center" color="text.secondary" paragraph>
      Say goodbye to long, frustrating hours of homework or research paper. With AssignmentAI, you'll get answers, diagrams, and code in a snap, making your school work 10X easier and quicker!
    </Typography>
    <Grid container spacing={4} mt={4}>
      {[
        { title: 'Free Plan', price: '$0', features: ['800 words/day', 'Limited access to All Our Tools', 'Unlock only "Standard" options', 'English Language Only', '1 User access', 'Standard support'], popular: false },
        { title: 'Junior Master Plan', price: '$5.99', features: ['5000 words/day', 'Full access to Assignment Tools', 'Full access to Content Writer Tools', 'Unlock "Advanced" options', 'English Language Only', '1 User access', 'Premium support'], popular: false },
        { title: 'Master Plan', price: '$8.33', features: ['500000 words/month', 'Full access to Math Solver Tools', 'Full access to Assignment Tools', 'Full access to Content Writer Tools', 'Full access to Upload Image and Get Answer Tool', 'Unlock "Advanced" options', 'English Language Only', '1 User access', 'Premium support'], popular: false },
        { title: 'Principal Plan', price: '$12.49', features: ['Unlimited words', 'Full access to AI Reviewer Tools', 'Full access to Math Solver Tools', 'Full access to Assignment Tools', 'Full access to Content Writer Tools', 'Full access to Upload Image and Get Answer Tool', 'Unlock "Advanced" options', '100+ Languages', 'Real Time sources', 'Priority access to new features', '3 User access', 'Dedicated support'], popular: true },
        { title: 'Lifetime Plan', price: '$179.99', features: ['Unlimited words', 'Full access to AI Reviewer Tools', 'Full access to Math Solver Tools', 'Full access to Assignment Tools', 'Full access to Content Writer Tools', 'Full access to Upload Image and Get Answer Tool', 'Unlock "Advanced" options', '100+ Languages', 'Real Time sources', 'Priority access to new features', '1 User access', 'Dedicated support'], popular: false },
        { title: 'Institute Plan', price: 'Let\'s Talk', features: ['Custom solutions', 'Bulk access', 'Comprehensive features', 'Dedicated support', 'Scalable infrastructure', 'Collaborative tools', 'Integration ready', 'Contact for customization'], popular: false },
      ].map((plan, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3, position: 'relative' }}>
            {plan.popular && (
              <Chip
                label="Most Popular"
                color="primary"
                sx={{ position: 'absolute', top: 10, right: 10 }}
              />
            )}
            <Typography variant="h5" gutterBottom>{plan.title}</Typography>
            <Typography variant="h4" gutterBottom>{plan.price}</Typography>
            <List>
              {plan.features.map((feature, i) => (
                <ListItem key={i}>
                  <ListItemIcon>✔</ListItemIcon>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
            <Button variant="contained" fullWidth sx={{ mt: 2 }}>Get Started</Button>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Container>
</Box>

<Box sx={{ py: 8, bgcolor: 'background.default' }}>
  <Container>
    <Typography variant="h3" align="center" gutterBottom>
      Frequently Asked Questions ❔
    </Typography>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">What is AssignmentAI?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>AssignmentAI is an AI-powered writing assistant designed to help students, blog writers, and teachers with their writing needs.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">How do I get started?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Simply sign up for a free account and choose your writing goal to begin.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Is my data secure?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Yes, all data is encrypted and stored securely. We prioritize your privacy.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Can AssignmentAI help with academic writing?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Absolutely, it can assist in generating essays, research papers, and even provide homework solutions.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">What about blog writing?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Yes, AssignmentAI can generate SEO-friendly, engaging blog posts tailored to your audience.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Is it useful for teachers?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Certainly, teachers can use it to create lesson plans, quizzes, and other educational content.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">How does the plagiarism checker work?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Our advanced algorithms compare your content with millions of documents to ensure originality.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Can I use it for social media?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Yes, you can create compelling social media posts for platforms like Facebook, Twitter, and Instagram.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">What formats can I download my content in?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>You can download your content in PDF, Word, or Google Docs formats.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Is there a free trial?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Yes, we offer a limited-time free trial for new users to explore our features.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">How do I upgrade my account?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>You can upgrade your account through the "Settings" tab on your dashboard.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Can I collaborate with others?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Yes, AssignmentAI allows for real-time collaboration on documents.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Is customer support available?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Our customer support team is available 24/7 to assist you with any queries.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">How often are new features added?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>We regularly update our platform to include new features based on user feedback.</Typography>
      </AccordionDetails>
    </Accordion>
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6">Do you offer an affiliate program?</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Typography>Absolutely! We've introduced our affiliate program to make it easy for you to earn by promoting AssignmentAI subscriptions. As an affiliate, you'll earn a 20% commission on each sale you generate. And the best part? There's no maximum limit to your potential earnings. Explore our affiliate program page to start your journey and learn more about how you can get started.</Typography>
      </AccordionDetails>
    </Accordion>
  </Container>
</Box>

<Box sx={{ py: 8, bgcolor: 'background.paper' }}>
  <Container>
    <Typography variant="h3" align="center" gutterBottom>
      Latest Blog Posts
    </Typography>
    <Grid container spacing={4} mt={4}>
      {[
        { title: 'Claude 3.7 vs Gemini 2.5 Pro | AI Coding Power Compared', description: 'Explore the strengths of Claude 3.7 and Gemini 2.5 Pro in AI coding. This comparison highlights their performance, features, and which excels for developers.', date: 'May 16, 2025', image: '/images/blog1.jpg' },
        { title: 'Typeset AI Detector Review | Features, Pricing & Test Results', description: 'Discover an in-depth review of Typeset AI Detector, covering its features, pricing plans, and test results to help you choose the right AI content detection tool.', date: 'May 16, 2025', image: '/images/blog2.jpg' },
        { title: 'Review of the top 5 undetectable AI writing tools', description: 'In this comprehensive review, we explore the top 5 AI writing tools that remain undetectable by plagiarism checkers and detectors, comparing features, ease of use, and output quality.', date: 'May 13, 2025', image: '/images/blog3.jpg' },
      ].map((post, index) => (
        <Grid item xs={12} sm={6} md={4} key={index}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardMedia
              component="img"
              height="140"
              image={post.image}
              alt={post.title}
            />
            <CardContent>
              <Typography variant="h6" gutterBottom>{post.title}</Typography>
              <Typography variant="body2" color="text.secondary" paragraph>{post.description}</Typography>
              <Typography variant="caption" color="text.secondary">{post.date}</Typography>
            </CardContent>
            <CardActions>
              <Button size="small" color="primary">Read More</Button>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Container>
</Box>

<Box sx={{ py: 8, bgcolor: 'background.default' }}>
  <Container>
    <Grid container spacing={4}>
      <Grid item xs={12} sm={6} md={3}>
        <Typography variant="h6" gutterBottom>Quick Links</Typography>
        <List>
          <ListItem><Link href="/">Home</Link></ListItem>
          <ListItem><Link href="/products">Products</Link></ListItem>
          <ListItem><Link href="/features">Features</Link></ListItem>
          <ListItem><Link href="/pricing">Pricing</Link></ListItem>
          <ListItem><Link href="/blogs">Blogs</Link></ListItem>
          <ListItem><Link href="/contact">Contact</Link></ListItem>
        </List>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Typography variant="h6" gutterBottom>Contact Us</Typography>
        <List>
          <ListItem>Email: support@assignmentai.com</ListItem>
          <ListItem>Phone: +1 (123) 456-7890</ListItem>
          <ListItem>Address: 123 AI Street, Tech City, TC 12345</ListItem>
        </List>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Typography variant="h6" gutterBottom>Follow Us</Typography>
        <Stack direction="row" spacing={2}>
          <IconButton><FacebookIcon /></IconButton>
          <IconButton><TwitterIcon /></IconButton>
          <IconButton><InstagramIcon /></IconButton>
          <IconButton><LinkedInIcon /></IconButton>
        </Stack>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Typography variant="h6" gutterBottom>Legal</Typography>
        <List>
          <ListItem><Link href="/privacy">Privacy Policy</Link></ListItem>
          <ListItem><Link href="/terms">Terms of Service</Link></ListItem>
        </List>
      </Grid>
    </Grid>
    <Typography variant="body2" align="center" sx={{ mt: 4 }}>
      © 2025 AssignmentAI, All rights reserved.
    </Typography>
  </Container>
</Box>
 