"""Exercise the actual backup block from the installed deployment script."""
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / 'release.sh'
BLOCK = SCRIPT.read_text().split('import os, subprocess, sys\n', 1)[1].split('\nPY\n', 1)[0]
BLOCK = 'import os, subprocess, sys\n' + BLOCK


class BackupTests(unittest.TestCase):
    def test_encoded_credentials_are_separate_libpq_fields(self):
        url = 'postgres://app:p%23ss%21@db.example:5433/lift?sslmode=require'
        with patch.dict(os.environ, {'DATABASE_URL': url}), patch.object(sys, 'argv', ['backup', '/tmp/test.dump']), patch('dotenv.load_dotenv'), patch('subprocess.run') as run:
            run.return_value.returncode = 0
            exec(BLOCK, {})
            args, kwargs = run.call_args
            env = kwargs['env']
            self.assertEqual(env['PGDATABASE'], 'lift')
            self.assertEqual(env['PGPASSWORD'], 'p#ss!')
            self.assertEqual(env['PGHOST'], 'db.example')
            self.assertEqual(env['PGPORT'], '5433')
            self.assertEqual(env['PGSSLMODE'], 'require')
            self.assertNotIn(url, str(args))
            self.assertTrue(kwargs['capture_output'])

    def test_failure_hides_provider_diagnostics(self):
        with patch.dict(os.environ, {'DATABASE_URL': 'postgres://app:secret@db/lift'}), patch.object(sys, 'argv', ['backup', '/tmp/test.dump']), patch('dotenv.load_dotenv'), patch('subprocess.run') as run:
            run.return_value.returncode = 1
            run.return_value.stderr = b'could not connect with secret'
            with self.assertRaisesRegex(SystemExit, '^Database backup failed; deployment stopped before migration.$'):
                exec(BLOCK, {})

    @unittest.skipUnless(os.environ.get('BACKUP_TEST_DATABASE_URL'), 'optional real PostgreSQL backup')
    def test_real_dump(self):
        with tempfile.TemporaryDirectory() as directory:
            dump = Path(directory) / 'backup.dump'
            with patch.dict(os.environ, {'DATABASE_URL': os.environ['BACKUP_TEST_DATABASE_URL']}), patch.object(sys, 'argv', ['backup', str(dump)]), patch('dotenv.load_dotenv'):
                exec(BLOCK, {})
            self.assertEqual(dump.read_bytes()[:5], b'PGDMP')


if __name__ == '__main__':
    unittest.main()
