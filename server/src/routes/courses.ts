import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { supabase } from '../lib/supabase';

const router = Router();

router.use(authMiddleware);

// GET / - List courses for the authenticated user
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener los cursos' });
  }
});

// GET /:id - Get course detail with chapters and questions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Fetch the course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user!.id)
      .single();

    if (courseError || !course) {
      res.status(404).json({ error: 'Curso no encontrado' });
      return;
    }

    // Fetch chapters with their questions
    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select(`
        *,
        questions (*)
      `)
      .eq('course_id', id)
      .order('order_index', { ascending: true });

    if (chaptersError) {
      res.status(500).json({ error: chaptersError.message });
      return;
    }

    res.json({ ...course, chapters });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener el curso' });
  }
});

// DELETE /:id - Delete a course
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user!.id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ message: 'Curso eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar el curso' });
  }
});

export default router;
