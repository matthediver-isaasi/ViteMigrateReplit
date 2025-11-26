import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Store Base44 ID to Supabase UUID mappings
const awardIdMap: Record<string, string> = {};
const offlineAwardIdMap: Record<string, string> = {};

async function importAwards() {
  console.log('\n=== Importing Awards ===');
  const csvPath = path.join(process.cwd(), 'attached_assets', 'Award_export_1764141327726.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  console.log(`Found ${records.length} awards to import`);

  // Check for existing awards by name
  const { data: existingAwards } = await supabase.from('award').select('id, name, base44_id');
  const existingNames = new Set((existingAwards || []).map(a => a.name));

  for (const record of records) {
    if (!record.name) continue;

    // Skip if already exists
    if (existingNames.has(record.name)) {
      console.log(`Skipping Award "${record.name}" - already exists`);
      // Still store mapping if base44_id matches
      const existing = existingAwards?.find(a => a.base44_id === record.id);
      if (existing) awardIdMap[record.id] = existing.id;
      continue;
    }

    const newId = uuidv4();
    const base44Id = record.id;
    
    // Store mapping for later reference
    awardIdMap[base44Id] = newId;

    const award = {
      id: newId,
      name: record.name,
      description: record.description || null,
      award_type: record.award_type || null,
      threshold: record.threshold ? parseInt(record.threshold) : null,
      level: record.level ? parseInt(record.level) : null,
      image_url: record.image_url || null,
      is_active: record.is_active === 'true',
      base44_id: base44Id,
    };

    console.log(`Importing Award: "${award.name}"`);

    const { data, error } = await supabase
      .from('award')
      .insert(award)
      .select();

    if (error) {
      console.error(`Error importing "${award.name}":`, error.message);
    } else {
      console.log(`Successfully imported Award: "${award.name}"`);
    }
  }
}

async function importAwardClassifications() {
  console.log('\n=== Importing Award Classifications ===');
  const csvPath = path.join(process.cwd(), 'attached_assets', 'AwardClassification_export_1764141327726.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  console.log(`Found ${records.length} award classifications to import`);

  // Check for existing classifications by name
  const { data: existingClassifications } = await supabase.from('award_classification').select('id, name');
  const existingNames = new Set((existingClassifications || []).map(c => c.name?.trim()));

  for (const record of records) {
    if (!record.name) continue;

    const trimmedName = record.name.trim();
    
    // Skip if already exists
    if (existingNames.has(trimmedName)) {
      console.log(`Skipping AwardClassification "${trimmedName}" - already exists`);
      continue;
    }

    const newId = uuidv4();
    const base44Id = record.id;
    
    // Store mapping - these are "offline awards" referenced by AwardSublevel
    offlineAwardIdMap[base44Id] = newId;

    const classification = {
      id: newId,
      name: record.name.trim(),
      description: record.description || null,
      award_category: record.award_category || null,
      display_order: record.display_order ? parseInt(record.display_order) : 0,
      is_active: record.is_active === 'true',
    };

    console.log(`Importing AwardClassification: "${classification.name}"`);

    const { data, error } = await supabase
      .from('award_classification')
      .insert(classification)
      .select();

    if (error) {
      console.error(`Error importing "${classification.name}":`, error.message);
    } else {
      console.log(`Successfully imported AwardClassification: "${classification.name}"`);
    }
  }
}

async function importAwardSublevels() {
  console.log('\n=== Importing Award Sublevels ===');
  const csvPath = path.join(process.cwd(), 'attached_assets', 'AwardSublevel_export_1764141327725.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  }) as Record<string, string>[];

  console.log(`Found ${records.length} award sublevels to import`);

  // Check for existing sublevels by name
  const { data: existingSublevels } = await supabase.from('award_sublevel').select('id, name');
  const existingNames = new Set((existingSublevels || []).map(s => s.name));

  for (const record of records) {
    if (!record.name) continue;

    // Skip if already exists
    if (existingNames.has(record.name)) {
      console.log(`Skipping AwardSublevel "${record.name}" - already exists`);
      continue;
    }

    const newId = uuidv4();

    const sublevel = {
      id: newId,
      name: record.name,
      display_order: record.display_order ? parseInt(record.display_order) : 0,
      is_active: record.is_active === 'true',
      award_category: 'offline',
    };

    console.log(`Importing AwardSublevel: "${sublevel.name}"`);

    const { data, error } = await supabase
      .from('award_sublevel')
      .insert(sublevel)
      .select();

    if (error) {
      console.error(`Error importing "${sublevel.name}":`, error.message);
    } else {
      console.log(`Successfully imported AwardSublevel: "${sublevel.name}"`);
      existingNames.add(record.name); // Prevent duplicates within same import
    }
  }
}

async function main() {
  try {
    await importAwards();
    await importAwardClassifications();
    await importAwardSublevels();
    console.log('\n=== All imports completed! ===');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

main();
