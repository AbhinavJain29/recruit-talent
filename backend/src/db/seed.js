import 'dotenv/config';
import pool from '../config/db.js';

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing data in dependency order
    await client.query('TRUNCATE notifications, candidate_interviewers, candidate_stage_history, candidates, jobs, interviewers, recruiters CASCADE');

    // Recruiters
    const { rows: recruiters } = await client.query(`
      INSERT INTO recruiters (name, email) VALUES
        ('Sarah Chen',   'sarah.chen@company.com'),
        ('Marcus Webb',  'marcus.webb@company.com')
      RETURNING id
    `);
    const [sarahId, marcusId] = recruiters.map(r => r.id);

    // Jobs
    const { rows: jobs } = await client.query(
      `INSERT INTO jobs (title, description, department, location, status, recruiter_id) VALUES
        ('Senior Frontend Engineer', 'Build and maintain our React-based recruiter portal.',           'Engineering', 'Remote',           'open',   $1),
        ('Backend Engineer',         'Design and implement scalable Node.js services and Kafka.',      'Engineering', 'New York, NY',     'open',   $2),
        ('Product Designer',         'Own the end-to-end design of our talent platform.',             'Design',      'San Francisco, CA','open',   $1),
        ('Data Analyst',             'Analyse hiring funnel metrics and produce actionable insights.', 'Analytics',   'Remote',           'closed', $2)
       RETURNING id`,
      [sarahId, marcusId]
    );
    const [feJobId, beJobId, dsJobId, daJobId] = jobs.map(j => j.id);

    // Interviewers
    const { rows: interviewers } = await client.query(`
      INSERT INTO interviewers (name, email) VALUES
        ('Alex Rivera', 'alex.rivera@company.com'),
        ('Priya Nair',  'priya.nair@company.com'),
        ('Tom Okafor',  'tom.okafor@company.com')
      RETURNING id
    `);
    const [alexId, priyaId, tomId] = interviewers.map(i => i.id);

    // Candidates — [name, email, jobId, stage]
    const candidateData = [
      // Senior Frontend Engineer
      ['Jordan Kim',     'jordan.kim@email.com',     feJobId, 'interview'],
      ['Lena Torres',    'lena.torres@email.com',    feJobId, 'tech_screen'],
      ['Devon Park',     'devon.park@email.com',     feJobId, 'recruiter_screen'],
      ['Mia Johnson',    'mia.johnson@email.com',    feJobId, 'rejected'],
      ['Zara Ahmed',     'zara.ahmed@email.com',     feJobId, 'offer'],
      ['Kai Tanaka',     'kai.tanaka@email.com',     feJobId, 'applied'],
      ['Nate Morrison',  'nate.morrison@email.com',  feJobId, 'hired'],

      // Backend Engineer
      ['Carlos Reyes',   'carlos.reyes@email.com',   beJobId, 'recruiter_screen'],
      ['Aisha Patel',    'aisha.patel@email.com',    beJobId, 'offer'],
      ['Sam Nguyen',     'sam.nguyen@email.com',     beJobId, 'hired'],
      ['Isabel Flores',  'isabel.flores@email.com',  beJobId, 'applied'],
      ['Marcus Lee',     'marcus.lee@email.com',     beJobId, 'interview'],
      ['Zoe Brennan',    'zoe.brennan@email.com',    beJobId, 'tech_screen'],
      ['Owen Blake',     'owen.blake@email.com',     beJobId, 'rejected'],

      // Product Designer
      ['Ruby Walsh',     'ruby.walsh@email.com',     dsJobId, 'applied'],
      ['Felix Grant',    'felix.grant@email.com',    dsJobId, 'interview'],
      ['Chris Nakamura', 'chris.nakamura@email.com', dsJobId, 'recruiter_screen'],
      ['Amara Obi',      'amara.obi@email.com',      dsJobId, 'offer'],
      ['Dylan Fox',      'dylan.fox@email.com',      dsJobId, 'tech_screen'],
      ['Sian Powell',    'sian.powell@email.com',    dsJobId, 'rejected'],

      // Data Analyst (closed role — mix of terminal and mid stages)
      ['Tara Singh',     'tara.singh@email.com',     daJobId, 'rejected'],
      ['Mei Chen',       'mei.chen@email.com',       daJobId, 'hired'],
      ['Lucas Ferreira', 'lucas.ferreira@email.com', daJobId, 'offer'],
      ['Nina Kapoor',    'nina.kapoor@email.com',    daJobId, 'interview'],
    ];

    const STAGE_ORDER = ['applied', 'recruiter_screen', 'tech_screen', 'interview', 'offer', 'hired'];

    const { rows: candidates } = await client.query(
      `INSERT INTO candidates (name, email, job_id, current_stage, resume_url, feedback_doc_url)
       VALUES ${candidateData.map((_, i) => {
         const base = i * 6;
         return `($${base+1}, $${base+2}, $${base+3}, $${base+4}::candidate_stage, $${base+5}, $${base+6})`;
       }).join(', ')}
       RETURNING id, name, current_stage`,
      candidateData.flatMap(([name, email, jobId, stage]) => {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        return [name, email, jobId, stage,
          `https://s3.example.com/resumes/${slug}.pdf`,
          `https://s3.example.com/feedback/${slug}.pdf`];
      })
    );

    // Stage history for each candidate
    for (const candidate of candidates) {
      const stage = candidate.current_stage;
      const currentIdx = STAGE_ORDER.indexOf(stage);

      // Build the path of stages this candidate went through
      const path = stage === 'rejected'
        ? [...STAGE_ORDER.slice(0, Math.floor(Math.random() * 4) + 1), 'rejected']
        : STAGE_ORDER.slice(0, currentIdx + 1);

      for (let i = 0; i < path.length; i++) {
        await client.query(
          `INSERT INTO candidate_stage_history (candidate_id, from_stage, to_stage)
           VALUES ($1, $2, $3)`,
          [candidate.id, i === 0 ? null : path[i - 1], path[i]]
        );
      }
    }

    // Assign interviewers to candidates at interview stage or beyond
    const interviewStages = new Set(['interview', 'offer', 'hired', 'rejected']);
    for (const candidate of candidates) {
      if (!interviewStages.has(candidate.current_stage)) continue;
      const assignees = [alexId, priyaId, tomId].slice(0, 2); // assign 2 interviewers
      for (const interviewerId of assignees) {
        await client.query(
          `INSERT INTO candidate_interviewers (candidate_id, interviewer_id)
           VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [candidate.id, interviewerId]
        );
      }
    }

    // Seed a sent notification for one rejected candidate per job
    const rejectedByJob = {};
    for (const c of candidates) {
      if (c.current_stage === 'rejected' && !rejectedByJob[c.job_id]) {
        rejectedByJob[c.job_id] = c;
      }
    }
    for (const c of Object.values(rejectedByJob)) {
      await client.query(
        `INSERT INTO notifications (candidate_id, email_body, status, sent_at)
         VALUES ($1, $2, 'sent', NOW())`,
        [c.id, `Hi ${c.name},\n\nThank you for your time. After careful consideration we have decided to move forward with other candidates.\n\nBest regards,\nThe Recruiting Team`]
      );
    }

    await client.query('COMMIT');
    console.log(`Seed complete — ${candidates.length} candidates across ${jobs.length} jobs`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error('Seed failed', err);
  process.exit(1);
});
