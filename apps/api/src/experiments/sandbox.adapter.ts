import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { execFile } from 'child_process';
import { promisify } from 'util';

const executeFile = promisify(execFile);

@Injectable()
export class DockerSandboxAdapter {
  private readonly binary = process.env.DOCKER_SANDBOX_BINARY || 'sbx';

  async create(name: string, workspacePath: string, allowNetwork: boolean) {
    const args = ['create', 'shell', '--name', name, '--clone'];
    if (!allowNetwork) args.push('--deny-network', '*');
    args.push(workspacePath);
    return this.run(args);
  }

  async execute(name: string, command: string) { return this.run(['exec', name, 'sh', '-lc', command], true); }
  async restore(name: string, baselineRef: string) { return this.execute(name, `git reset --hard ${this.ref(baselineRef)} && git clean -fd`); }
  async remove(name: string) { return this.run(['rm', '--force', name]); }
  async list() { return this.run(['ls', '--json']); }

  private ref(value: string) {
    if (!/^[A-Za-z0-9._/^-]+$/.test(value)) throw new ServiceUnavailableException('Invalid candidate or baseline Git ref');
    return value;
  }

  private async run(args: string[], tolerateExitFailure = false): Promise<{ output: string; exitCode: number }> {
    try {
      const result = await executeFile(this.binary, args, { timeout: 15 * 60_000, maxBuffer: 1024 * 1024 });
      return { output: `${result.stdout}${result.stderr}`.trim(), exitCode: 0 };
    } catch (error: any) {
      if (error?.code === 'ENOENT') throw new ServiceUnavailableException('Docker Sandboxes CLI (sbx) is not installed or not on PATH');
      if (tolerateExitFailure && typeof error?.code === 'number') return { output: `${error.stdout || ''}${error.stderr || ''}`.trim(), exitCode: error.code };
      throw new ServiceUnavailableException(error?.stderr || error?.message || 'Docker Sandbox command failed');
    }
  }
}
