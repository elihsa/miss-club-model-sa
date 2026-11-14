#!/usr/bin/env node

/**
 * Track development time for the Miss Club Model SA project
 * Usage: node scripts/track-time.js [command]
 * Commands:
 *   - init: Initialize time tracking (creates tracking file)
 *   - log: Log current session start
 *   - stop: Log session end
 *   - report: Show total time spent
 *   - since <date>: Show time since a specific date (ISO format)
 */

const fs = require('fs');
const path = require('path');

const TRACKING_FILE = path.join(__dirname, '../.dev-time.json');

function loadTracking() {
  if (fs.existsSync(TRACKING_FILE)) {
    return JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'));
  }
  return {
    sessions: [],
    activeSession: null,
    createdAt: new Date().toISOString()
  };
}

function saveTracking(data) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify(data, null, 2));
}

function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

function init() {
  const data = loadTracking();
  saveTracking(data);
  console.log('✓ Time tracking initialized');
  console.log(`  Started: ${new Date(data.createdAt).toLocaleString()}`);
}

function log() {
  const data = loadTracking();
  if (data.activeSession) {
    console.log('⚠ Session already active since', new Date(data.activeSession).toLocaleString());
    return;
  }
  data.activeSession = new Date().toISOString();
  saveTracking(data);
  console.log('✓ Session started at', new Date().toISOString());
}

function stop() {
  const data = loadTracking();
  if (!data.activeSession) {
    console.log('⚠ No active session');
    return;
  }
  const start = new Date(data.activeSession);
  const end = new Date();
  const duration = end - start;
  
  data.sessions.push({
    start: data.activeSession,
    end: end.toISOString(),
    duration
  });
  data.activeSession = null;
  saveTracking(data);
  
  console.log('✓ Session ended');
  console.log(`  Duration: ${formatDuration(duration)}`);
  console.log(`  Total sessions: ${data.sessions.length}`);
}

function report() {
  const data = loadTracking();
  if (data.sessions.length === 0) {
    console.log('No sessions recorded yet');
    return;
  }
  
  const total = data.sessions.reduce((sum, s) => sum + s.duration, 0);
  const avg = total / data.sessions.length;
  
  console.log('=== Development Time Report ===');
  console.log(`Tracking started: ${new Date(data.createdAt).toLocaleString()}`);
  console.log(`Total sessions: ${data.sessions.length}`);
  console.log(`Total time: ${formatDuration(total)}`);
  console.log(`Average session: ${formatDuration(avg)}`);
  
  if (data.activeSession) {
    const activeDuration = Date.now() - new Date(data.activeSession);
    console.log(`Active session: ${formatDuration(activeDuration)} (ongoing)`);
  }
}

function since(dateStr) {
  const data = loadTracking();
  const sinceDate = new Date(dateStr);
  
  if (isNaN(sinceDate.getTime())) {
    console.error('Invalid date format. Use ISO format (e.g., 2026-11-01T00:00:00)');
    process.exit(1);
  }
  
  const filtered = data.sessions.filter(s => new Date(s.start) >= sinceDate);
  const total = filtered.reduce((sum, s) => sum + s.duration, 0);
  
  console.log(`=== Time Since ${sinceDate.toLocaleString()} ===`);
  console.log(`Sessions: ${filtered.length}`);
  console.log(`Total time: ${formatDuration(total)}`);
}

function showHelp() {
  console.log(`
Development Time Tracker

Usage: node scripts/track-time.js [command]

Commands:
  init    Initialize time tracking
  log     Start a new session
  stop    End current session
  report  Show total time spent
  since   Show time since a date (node scripts/track-time.js since 2026-11-01)
  help    Show this help

Examples:
  node scripts/track-time.js init
  node scripts/track-time.js log     # Start working
  node scripts/track-time.js stop    # Finish working
  node scripts/track-time.js report  # See total time
`);
}

// Main
const command = process.argv[2] || 'help';

switch (command) {
  case 'init':
    init();
    break;
  case 'log':
    log();
    break;
  case 'stop':
    stop();
    break;
  case 'report':
    report();
    break;
  case 'since':
    if (!process.argv[3]) {
      console.error('Please provide a date. Usage: node scripts/track-time.js since 2026-11-01');
      process.exit(1);
    }
    since(process.argv[3]);
    break;
  case 'help':
  default:
    showHelp();
}
