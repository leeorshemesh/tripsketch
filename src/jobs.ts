/**
 * Background-job handler — invoked by AppJobRoom for every queued job.
 *
 * TripSketch uses one type: `generate-trip` (search → plan → cover).
 */

import type { Job, JobContext } from 'deepspace/worker'
import type { Env } from '../worker'
import {
  runGenerateTripJob,
  type GenerateTripPayload,
} from './server/jobs/generateTripJob'

export async function runJob(
  job: Job,
  ctx: JobContext,
  env: Env,
): Promise<unknown> {
  switch (job.type) {
    case 'generate-trip':
      return await runGenerateTripJob(job.payload as GenerateTripPayload, ctx, env)
    default:
      throw new Error(`Unknown job type: ${job.type}`)
  }
}
