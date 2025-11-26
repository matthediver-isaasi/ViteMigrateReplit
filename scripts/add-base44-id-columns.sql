-- Add base44_id column to all tables that need it for data migration
-- Run this script in your Supabase SQL Editor before running the data migration

-- Organization
ALTER TABLE organization ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_organization_base44_id ON organization(base44_id);

-- Event
ALTER TABLE event ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_event_base44_id ON event(base44_id);

-- Booking
ALTER TABLE booking ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_booking_base44_id ON booking(base44_id);

-- Program Ticket Transaction
ALTER TABLE program_ticket_transaction ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_program_ticket_transaction_base44_id ON program_ticket_transaction(base44_id);

-- Magic Link
ALTER TABLE magic_link ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_magic_link_base44_id ON magic_link(base44_id);

-- Organization Contact
ALTER TABLE organization_contact ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_organization_contact_base44_id ON organization_contact(base44_id);

-- Program
ALTER TABLE program ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_program_base44_id ON program(base44_id);

-- Blog Post
ALTER TABLE blog_post ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_blog_post_base44_id ON blog_post(base44_id);

-- Team Member
ALTER TABLE team_member ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_team_member_base44_id ON team_member(base44_id);

-- Discount Code
ALTER TABLE discount_code ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_discount_code_base44_id ON discount_code(base44_id);

-- System Settings
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_system_settings_base44_id ON system_settings(base44_id);

-- Resource
ALTER TABLE resource ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_resource_base44_id ON resource(base44_id);

-- Resource Category
ALTER TABLE resource_category ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_resource_category_base44_id ON resource_category(base44_id);

-- File Repository
ALTER TABLE file_repository ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_file_repository_base44_id ON file_repository(base44_id);

-- File Repository Folder
ALTER TABLE file_repository_folder ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_file_repository_folder_base44_id ON file_repository_folder(base44_id);

-- Job Posting
ALTER TABLE job_posting ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_job_posting_base44_id ON job_posting(base44_id);

-- Page Banner
ALTER TABLE page_banner ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_page_banner_base44_id ON page_banner(base44_id);

-- IEdit Page
ALTER TABLE iedit_page ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_iedit_page_base44_id ON iedit_page(base44_id);

-- IEdit Page Element
ALTER TABLE iedit_page_element ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_iedit_page_element_base44_id ON iedit_page_element(base44_id);

-- IEdit Element Template
ALTER TABLE iedit_element_template ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_iedit_element_template_base44_id ON iedit_element_template(base44_id);

-- Navigation Item
ALTER TABLE navigation_item ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_navigation_item_base44_id ON navigation_item(base44_id);

-- Article Comment
ALTER TABLE article_comment ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_article_comment_base44_id ON article_comment(base44_id);

-- Comment Reaction
ALTER TABLE comment_reaction ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_comment_reaction_base44_id ON comment_reaction(base44_id);

-- Article Reaction
ALTER TABLE article_reaction ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_article_reaction_base44_id ON article_reaction(base44_id);

-- Article View
ALTER TABLE article_view ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_article_view_base44_id ON article_view(base44_id);

-- Button Style
ALTER TABLE button_style ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_button_style_base44_id ON button_style(base44_id);

-- Award
ALTER TABLE award ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_award_base44_id ON award(base44_id);

-- Offline Award
ALTER TABLE offline_award ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_offline_award_base44_id ON offline_award(base44_id);

-- Offline Award Assignment
ALTER TABLE offline_award_assignment ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_offline_award_assignment_base44_id ON offline_award_assignment(base44_id);

-- Wall of Fame Section
ALTER TABLE wall_of_fame_section ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_wall_of_fame_section_base44_id ON wall_of_fame_section(base44_id);

-- Wall of Fame Category
ALTER TABLE wall_of_fame_category ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_wall_of_fame_category_base44_id ON wall_of_fame_category(base44_id);

-- Wall of Fame Person
ALTER TABLE wall_of_fame_person ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_wall_of_fame_person_base44_id ON wall_of_fame_person(base44_id);

-- Floater
ALTER TABLE floater ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_floater_base44_id ON floater(base44_id);

-- Form
ALTER TABLE form ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_form_base44_id ON form(base44_id);

-- Form Submission
ALTER TABLE form_submission ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_form_submission_base44_id ON form_submission(base44_id);

-- Tour Group
ALTER TABLE tour_group ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_tour_group_base44_id ON tour_group(base44_id);

-- Tour Step
ALTER TABLE tour_step ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_tour_step_base44_id ON tour_step(base44_id);

-- News Post
ALTER TABLE news_post ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_news_post_base44_id ON news_post(base44_id);

-- Resource Author Settings
ALTER TABLE resource_author_settings ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_resource_author_settings_base44_id ON resource_author_settings(base44_id);

-- Zoho Token
ALTER TABLE zoho_token ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_zoho_token_base44_id ON zoho_token(base44_id);

-- Xero Token
ALTER TABLE xero_token ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_xero_token_base44_id ON xero_token(base44_id);

-- Portal Menu
ALTER TABLE portal_menu ADD COLUMN IF NOT EXISTS base44_id TEXT;
CREATE INDEX IF NOT EXISTS idx_portal_menu_base44_id ON portal_menu(base44_id);

-- Article Category (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'article_category') THEN
    ALTER TABLE article_category ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_article_category_base44_id ON article_category(base44_id);
  END IF;
END $$;

-- Portal Navigation Item (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'portal_navigation_item') THEN
    ALTER TABLE portal_navigation_item ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_portal_navigation_item_base44_id ON portal_navigation_item(base44_id);
  END IF;
END $$;

-- Member Group (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_group') THEN
    ALTER TABLE member_group ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_member_group_base44_id ON member_group(base44_id);
  END IF;
END $$;

-- Member Group Assignment (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_group_assignment') THEN
    ALTER TABLE member_group_assignment ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_member_group_assignment_base44_id ON member_group_assignment(base44_id);
  END IF;
END $$;

-- Guest Writer (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guest_writer') THEN
    ALTER TABLE guest_writer ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_guest_writer_base44_id ON guest_writer(base44_id);
  END IF;
END $$;

-- Award Classification (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'award_classification') THEN
    ALTER TABLE award_classification ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_award_classification_base44_id ON award_classification(base44_id);
  END IF;
END $$;

-- Award Sublevel (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'award_sublevel') THEN
    ALTER TABLE award_sublevel ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_award_sublevel_base44_id ON award_sublevel(base44_id);
  END IF;
END $$;

-- Member Group Guest (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_group_guest') THEN
    ALTER TABLE member_group_guest ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_member_group_guest_base44_id ON member_group_guest(base44_id);
  END IF;
END $$;

-- Discount Code Usage (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discount_code_usage') THEN
    ALTER TABLE discount_code_usage ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_discount_code_usage_base44_id ON discount_code_usage(base44_id);
  END IF;
END $$;

-- Resource Folder (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_folder') THEN
    ALTER TABLE resource_folder ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_resource_folder_base44_id ON resource_folder(base44_id);
  END IF;
END $$;

-- Support Ticket (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_ticket') THEN
    ALTER TABLE support_ticket ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_support_ticket_base44_id ON support_ticket(base44_id);
  END IF;
END $$;

-- Support Ticket Response (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_ticket_response') THEN
    ALTER TABLE support_ticket_response ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_support_ticket_response_base44_id ON support_ticket_response(base44_id);
  END IF;
END $$;

-- Voucher (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'voucher') THEN
    ALTER TABLE voucher ADD COLUMN IF NOT EXISTS base44_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_voucher_base44_id ON voucher(base44_id);
  END IF;
END $$;

-- Done!
SELECT 'base44_id columns added successfully!' as result;
