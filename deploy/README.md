# TigerLift production deployment

The live `lift.tigerapps.org` hostname reaches `tiger-lift.service` on EC2
`i-0b2bfc5624ab3f9bf` in AWS account `104733724423`, region `us-east-1`.
Nginx proxies to gunicorn at `127.0.0.1:8100`. Heroku is not the production host.

GitHub Actions tests the backend and builds the frontend on every PR and main push.
Main pushes upload the tested source/build archive to the private, encrypted,
versioned `tigerlift-deploy-104733724423-us-east-1` bucket. GitHub OIDC can write
only `releases/` and invoke the `TigerLiftDeploy` SSM document on this one instance.
The document accepts only a commit SHA and SHA256 checksum, not arbitrary commands.

The host executes `/usr/local/sbin/tigerlift-deploy`, installed from `release.sh`.
This root-owned script downloads and verifies the archive, installs dependencies
in a separate release virtualenv, backs up PostgreSQL, applies the application's
migrations, and switches the `tiger-lift-current` symlink. It verifies the exact
frontend HTML and the signed-out session endpoint. If restart or health checks
fail, it restores the preceding release and exits with a failed deployment status.
GitHub also compares the public HTML with the artifact after deployment.

Paths:

- Releases: `/home/ubuntu/apps/tiger-lift-releases/<sha>`
- Active symlink: `/home/ubuntu/apps/tiger-lift-current`
- Last successful SHA: `/home/ubuntu/apps/tiger-lift-deployed-sha`
- Existing private config: `/home/ubuntu/apps/tiger-lift/backend/.env` (symlinked into releases)
- Database backups: `/var/backups/tigerlift/<sha>.dump` (root-only)
- Systemd override: `/etc/systemd/system/tiger-lift.service.d/deployment.conf`
- S3 client: `/opt/tigerlift-deploy-tools/bin/python` with boto3, using the EC2 instance role

The original checkout remains intact as the initial rollback release. Never put
production credentials into release archives or GitHub. Deployments serialize
with a host lock. Schema migrations must remain backward-compatible; application
rollback does not undo database changes. Database restoration requires a separate
maintenance operation. Monitor disk space and archive/remove old releases and
backups after retaining the active and previous working releases.

To roll back application code through an authorized SSM shell, atomically repoint
`tiger-lift-current` at a previously verified release and restart
`tiger-lift.service`. For an initial rollback it may point at the original
`/home/ubuntu/apps/tiger-lift` directory. Verify `/` and `/api/isloggedin` afterward.
Changes to `release.sh` require installing the updated root-owned host copy;
ordinary application changes need only a merge to main.
