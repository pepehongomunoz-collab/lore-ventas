// Load environment variables first
require('dotenv').config();

const { Vexor } = require('vexor');

/**
 * Initialize Vexor SDK with environment variables
 * Vexor.fromEnv() automatically loads:
 * - VEXOR_PROJECT_ID
 * - VEXOR_PUBLISHABLE_KEY
 * - VEXOR_SECRET_KEY
 */
const vexor = Vexor.fromEnv();

module.exports = { vexor };
