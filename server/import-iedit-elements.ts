import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CSV data from the export - parsed manually
const elementsData = [
  {
    page_id: "69125489749eb60ece691c69",
    element_type: "hero",
    display_order: 1,
    content: {"heading":"Welcome to Graduate Futures","subheading":"We're the leading careers body in higher education, with a vibrant community spanning the entire employability mission. We help universities turn learning into fulfilling careers, stronger workplaces and a fairer society.","buttonText":"Find out more","buttonLink":"#"},
    style_variant: "dark",
    settings: {"fullWidth":true},
    original_id: "69125499aa4ff4fbf64d524e",
    created_date: "2025-11-10T21:09:45.534000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69125489749eb60ece691c69",
    element_type: "two_column",
    display_order: 3,
    content: {"leftHeading":"Left Column","leftContent":"Content for the left column goes here.","rightHeading":"Right Column","rightContent":"Content for the right column goes here."},
    style_variant: "default",
    settings: {},
    original_id: "6912557b53c4b54092e2e2b6",
    created_date: "2025-11-10T21:13:31.442000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69125d4cefc093fc1dd1cf35",
    element_type: "hero",
    display_order: 0,
    content: {"heading":"Welcome to Our Website","subheading":"Create amazing experiences with our platform","buttonText":"Get Started","buttonLink":"#"},
    style_variant: "default",
    settings: {"fullWidth":false},
    original_id: "69125d57e20b8bafc4cb51ca",
    created_date: "2025-11-10T21:47:03.111000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69125d4cefc093fc1dd1cf35",
    element_type: "wall_of_fame",
    display_order: 3,
    content: {"section_id":"691984a55a8df00f250de466"},
    style_variant: "default",
    settings: {},
    original_id: "69199008e3cccefcd7821e6d",
    created_date: "2025-11-16T08:49:12.186000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69125d4cefc093fc1dd1cf35",
    element_type: "form",
    display_order: 2,
    content: {"form_slug":"something-missing-copy-1763455317170"},
    style_variant: "default",
    settings: {},
    original_id: "691c45a442d235173b1d5fb6",
    created_date: "2025-11-18T10:08:36.359000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "691c55376ae6a4e64e60880c",
    element_type: "text_overlay_image",
    display_order: 1,
    content: {"opacity":0.9,"backgroundImage":"https://base44.app/api/apps/68efc20f3e0a30fafad6dde7/files/public/68efc20f3e0a30fafad6dde7/fe3424aa3_WhatsAppImage2025-11-19at114526.jpeg","header":"About Graduate Futures","text":"The Graduate Futures Institute is higher education's leading body for careers and employability, uniquely spanning the full employability mission across institutions."},
    style_variant: "default",
    settings: {},
    original_id: "691c55b9e59c3915fec8cda9",
    created_date: "2025-11-18T11:15:37.915000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "691c55376ae6a4e64e60880c",
    element_type: "table",
    display_order: 2,
    content: {"rows":4,"cols":2,"cells":{"0-0":"https://base44.app/api/apps/68efc20f3e0a30fafad6dde7/files/public/68efc20f3e0a30fafad6dde7/850530b5a_Welcome.png","0-1":"<p><strong>Welcome</strong></p><p>Content for the left column goes here.</p>","1-0":"https://base44.app/api/apps/68efc20f3e0a30fafad6dde7/files/public/68efc20f3e0a30fafad6dde7/989467aa9_Impact.png","1-1":"<p><strong>Impact</strong></p>"}},
    style_variant: "default",
    settings: {},
    original_id: "691c5a7b48f8ac20e39fb7b9",
    created_date: "2025-11-18T11:35:55.722000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69125489749eb60ece691c69",
    element_type: "banner_carousel",
    display_order: 0,
    content: {"banners":[{"id":"banner-1763660782291","headerText":"Banner 1","paragraphText":"This is where banner 1 needs text","ctaText":"What CTA 1","ctaLink":"/#","backgroundImage":""},{"id":"banner-1763660928991","headerText":"Banner 2","paragraphText":"This is where banner 2 needs text","ctaText":"What CTA 2","ctaLink":"/#","backgroundImage":""},{"id":"banner-1763660962052","headerText":"Banner 3","paragraphText":"This is where banner 3 needs text","ctaText":"What CTA 3","ctaLink":"/#","backgroundImage":""}]},
    style_variant: "default",
    settings: {},
    original_id: "6920406e4918d0bd20b23dde",
    created_date: "2025-11-21T09:06:22.689000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69125489749eb60ece691c69",
    element_type: "showcase",
    display_order: 2,
    content: {"headerText":"What's New","descriptionText":"Some text should go here perhaps?","contentType":"news","backgroundImage":"https://base44.app/api/apps/68efc20f3e0a30fafad6dde7/files/public/68efc20f3e0a30fafad6dde7/821535841_bg2.png","cards":[{"contentType":"news","itemId":"691c692481f0dda8047002ee"},{"contentType":"articles","itemId":"691eefde461011d1011a0148"},{"contentType":"resources","itemId":"691dded30366c9b1fccf0d21"}],"cardCount":3},
    style_variant: "default",
    settings: {},
    original_id: "69204c2ce7d05d6a4ed8d3b8",
    created_date: "2025-11-21T09:55:40.254000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69209cbc0307dc67c7a39f2b",
    element_type: "page_header_hero",
    display_order: 0,
    content: {"image_url":"https://base44.app/api/apps/68efc20f3e0a30fafad6dde7/files/public/68efc20f3e0a30fafad6dde7/9b4ad100c_homeHero.png","header_text":"Shaping\nfutures\ntogether","header_position":"right","header_font_family":"Degular Medium","header_font_size":"120","header_color":"#ffffff","line_spacing":"0.9","padding_horizontal":"25","text_padding_right":"130","height_type":"auto","image_fit":"cover"},
    style_variant: "default",
    settings: {},
    original_id: "69209cc79fb3ddeea4e1a01c",
    created_date: "2025-11-21T15:36:39.627000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69209cbc0307dc67c7a39f2b",
    element_type: "button_block",
    display_order: 1,
    content: {"header":"How can we help you?","header_alignment":"center","background_color":"#000000","header_font_family":"Poppins","header_font_size":"20","header_color":"#ffffff","button_gap":"28","buttons":[{"text":"Membership Area","link":"https://google.com","button_style_id":"","open_in_new_tab":false,"size":"large","show_arrow":true,"custom_bg_color":"#000000","custom_text_color":"#ffffff"}]},
    style_variant: "default",
    settings: {},
    original_id: "6920a54ce0dfeb52acfa8ca9",
    created_date: "2025-11-21T16:12:44.619000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69209cbc0307dc67c7a39f2b",
    element_type: "hero",
    display_order: 2,
    content: {"heading":"ABOUT US","subheading":"We are committed to student fulfilment and success.  Not only do graduates benefit, but also the higher education sector and society as a whole.  It really makes a difference.","buttonText":"Learn More","buttonLink":"#","subheading_font_family":"Degular Medium","button":{"text":"Learn More","link":"","button_style_id":"","open_in_new_tab":false,"size":"medium","show_arrow":true}},
    style_variant: "default",
    settings: {},
    original_id: "6920a59b96da0cd96ab9dfeb",
    created_date: "2025-11-21T16:14:03.556000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69209cbc0307dc67c7a39f2b",
    element_type: "showcase",
    display_order: 3,
    content: {"headerText":"NEWS & MEDIA","descriptionText":"What's New","contentType":"news","backgroundImage":"","cards":[{"contentType":"news","itemId":"69204a09bf579bb673c1489f","labelBgColor":"#000000"},{"contentType":"resources","itemId":"691dded30366c9b1fccf0d21","labelBgColor":"#000000"},{"contentType":"articles","itemId":"691eefde461011d1011a0148","labelBgColor":"#000000"}],"cardCount":3},
    style_variant: "default",
    settings: {},
    original_id: "6920a5deb49c5011f4a66aee",
    created_date: "2025-11-21T16:15:10.295000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "69209cbc0307dc67c7a39f2b",
    element_type: "resources_showcase",
    display_order: 4,
    content: {"headerText":"RESOURCES","subheaderText":"Access Our Resources","descriptionText":"Sign up to become a member to unlock all our resources.","heading_font_family":"Poppins","heading_font_size":16,"heading_letter_spacing":5,"heading_color":"#ffffff","heading_underline_enabled":true,"heading_underline_color":"#ffffff","heading_underline_width":15,"heading_underline_weight":2},
    style_variant: "default",
    settings: {},
    original_id: "6920a60f9dd3df94f20ec9cb",
    created_date: "2025-11-21T16:15:59.207000",
    created_by: "mat.the.diver@googlemail.com",
    is_sample: false
  },
  {
    page_id: "6925bac3d429305ede38853b",
    element_type: "image_hero",
    display_order: 0,
    content: {"backgroundImageUrl":"","foregroundImageUrl":"","height":"medium","contentAlignment":"center","overlayOpacity":0},
    style_variant: "default",
    settings: {},
    original_id: "6925bb0d4a031d8b19a71cd3",
    created_date: "2025-11-25T14:19:57.231000",
    created_by: "anonymous",
    is_sample: false
  },
  {
    page_id: "6925bac3d429305ede38853b",
    element_type: "text_block",
    display_order: 2,
    content: {"heading":"Section Heading","text":"As the leading voices for careers and employability in higher education, our communications team work with journalists across the UK. We provide commentary on topical news and can provide case studies and interviews with a range of experts in careers and employability."},
    style_variant: "default",
    settings: {},
    original_id: "6925bb4bd9af1dbb7e1c19c5",
    created_date: "2025-11-25T14:20:59.346000",
    created_by: "anonymous",
    is_sample: false
  },
  {
    page_id: "6925bac3d429305ede38853b",
    element_type: "cta_button",
    display_order: 3,
    content: {"text":"Email","link":"mailto:communications@graduatesfutures.org.uk","alignment":"center","openInNewTab":true},
    style_variant: "default",
    settings: {},
    original_id: "6925bbc4a759846ce5eed334",
    created_date: "2025-11-25T14:23:00.942000",
    created_by: "anonymous",
    is_sample: false
  },
  {
    page_id: "6925bac3d429305ede38853b",
    element_type: "two_column",
    display_order: 1,
    content: {"leftHeading":"Left Column","leftContent":"Content for the left column goes here.","rightHeading":"","rightContent":"As the leading voices for careers and employability in higher education, our communications team work with journalists across the UK."},
    style_variant: "default",
    settings: {},
    original_id: "6925bd0915d85a56566389d5",
    created_date: "2025-11-25T14:28:25.580000",
    created_by: "anonymous",
    is_sample: false
  },
  {
    page_id: "6925bac3d429305ede38853b",
    element_type: "page_header_hero",
    display_order: 4,
    content: {"image_url":"","header_text":"Welcome","header_position":"left","header_font_family":"Poppins","header_font_size":"48","header_color":"#ffffff"},
    style_variant: "default",
    settings: {},
    original_id: "6925bd2015d85a56566389d7",
    created_date: "2025-11-25T14:28:48.691000",
    created_by: "anonymous",
    is_sample: false
  }
];

// Map old Base44 page IDs to new UUIDs - we'll need to look these up from i_edit_page
const pageIdMapping: Record<string, string> = {};

async function getPageIdMapping() {
  // Get all pages from i_edit_page to map old IDs
  const { data: pages, error } = await supabase
    .from('i_edit_page')
    .select('id, slug');
  
  if (error) {
    console.error('Error fetching pages:', error);
    return false;
  }
  
  console.log('Existing pages in i_edit_page:', pages);
  return pages;
}

async function importElements() {
  console.log('Starting i_edit_page_element import...');
  
  // First check if there are existing pages we can map to
  const pages = await getPageIdMapping();
  
  if (!pages || pages.length === 0) {
    console.log('No pages found in i_edit_page. You may need to import pages first.');
    console.log('Proceeding with element import using generated UUIDs for page references...');
  }
  
  // Create a mapping of old page IDs to new UUIDs
  // For now, generate new UUIDs for page_ids that don't exist
  const uniquePageIds = [...new Set(elementsData.map(e => e.page_id))];
  console.log('Unique page IDs needed:', uniquePageIds);
  
  // Generate new UUIDs for each unique page_id
  uniquePageIds.forEach(oldId => {
    pageIdMapping[oldId] = uuidv4();
  });
  console.log('Page ID mapping:', pageIdMapping);
  
  // Transform and insert elements (only include columns that exist in Supabase schema)
  const transformedElements = elementsData.map(element => ({
    id: uuidv4(),
    page_id: pageIdMapping[element.page_id],
    element_type: element.element_type,
    display_order: element.display_order,
    content: element.content,
    style_variant: element.style_variant,
    settings: element.settings
  }));
  
  console.log(`Inserting ${transformedElements.length} elements...`);
  
  const { data, error } = await supabase
    .from('i_edit_page_element')
    .insert(transformedElements)
    .select();
  
  if (error) {
    console.error('Error inserting elements:', error);
    return;
  }
  
  console.log(`Successfully inserted ${data?.length} elements`);
  console.log('Sample inserted element:', data?.[0]);
  
  // Also output the page ID mapping for reference
  console.log('\n=== PAGE ID MAPPING (save this for i_edit_page import) ===');
  Object.entries(pageIdMapping).forEach(([oldId, newId]) => {
    console.log(`  "${oldId}" => "${newId}"`);
  });
}

importElements().catch(console.error);
