import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { analyzeAssignment } from '../services/aiAnalysis';
import { deleteFile, getFileUrl, uploadFile, validateFile } from '../services/fileStorage';
import { sendAssignmentNotification, sendStatusChangeNotification } from '../services/notification';

const router = express.Router();

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Get all assignments
router.get('/', async (req, res) => {
  try {
    // TODO: Implement database query
    const assignments = [
      {
        id: '1',
        title: 'Math Homework',
        subject: 'Mathematics',
        dueDate: '2024-03-15',
        status: 'In Progress',
        priority: 'High',
        progress: 65,
      },
    ];
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get a single assignment
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Implement database query
    const assignment = {
      id,
      title: 'Math Homework',
      description: 'Complete exercises 1-10 from Chapter 5',
      subject: 'Mathematics',
      dueDate: '2024-03-15',
      status: 'In Progress',
      priority: 'High',
      progress: 65,
      fileUrl: '/uploads/sample.pdf',
      aiAnalysis: {
        summary: 'This assignment focuses on algebraic equations',
        keyPoints: ['Solve linear equations', 'Apply the quadratic formula'],
        recommendations: ['Start with easier problems', 'Use a calculator'],
        estimatedTime: '2-3 hours',
        difficulty: 'Medium',
      },
    };

    // Generate a signed URL for the file if it exists
    if (assignment.fileUrl) {
      const fileName = path.basename(assignment.fileUrl);
      assignment.fileUrl = await getFileUrl(fileName);
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create a new assignment
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, description, subject, dueDate, priority } = req.body;
    const file = req.file;

    let fileUrl = null;
    let aiAnalysis = null;

    if (file) {
      if (!validateFile(file)) {
        throw new Error('Invalid file type or size');
      }

      // Upload file to S3
      const fileName = await uploadFile(file);
      fileUrl = `/uploads/${fileName}`;

      // Analyze the file
      aiAnalysis = await analyzeAssignment(file.path);
    }

    const assignment = {
      id: uuidv4(),
      title,
      description,
      subject,
      dueDate,
      status: 'Not Started',
      priority,
      progress: 0,
      fileUrl,
      aiAnalysis,
    };

    // TODO: Save to database

    // Send notification
    await sendAssignmentNotification(req.user.id, req.user.email, title, 'created');

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Update an assignment
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, subject, dueDate, priority } = req.body;
    const file = req.file;

    let fileUrl = null;
    let aiAnalysis = null;

    if (file) {
      if (!validateFile(file)) {
        throw new Error('Invalid file type or size');
      }

      // Upload file to S3
      const fileName = await uploadFile(file);
      fileUrl = `/uploads/${fileName}`;

      // Analyze the file
      aiAnalysis = await analyzeAssignment(file.path);
    }

    const assignment = {
      id,
      title,
      description,
      subject,
      dueDate,
      priority,
      fileUrl,
      aiAnalysis,
    };

    // TODO: Update in database

    // Send notification
    await sendAssignmentNotification(req.user.id, req.user.email, title, 'updated');

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// Delete an assignment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Get assignment from database
    const assignment = {
      id,
      fileUrl: '/uploads/sample.pdf',
    };

    // Delete file from S3 if it exists
    if (assignment.fileUrl) {
      const fileName = path.basename(assignment.fileUrl);
      await deleteFile(fileName);
    }

    // TODO: Delete from database
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

// Update assignment status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress } = req.body;

    // TODO: Update in database
    const assignment = {
      id,
      title: 'Math Homework',
      status,
      progress,
    };

    // Send notification
    await sendStatusChangeNotification(req.user.id, req.user.email, assignment.title, status);

    res.json({ status, progress });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Get assignment status
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Get from database
    const status = {
      status: 'In Progress',
      progress: 65,
    };
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
