-- =========================================================================
-- CORE IQ CREATE // API KEY SCOPES MIGRATION
-- Migration: 20261008_update_claude_code_scopes.sql
-- Description: Add WRITE_MEDIA and READ_MEDIA to Claude-Code API key
-- =========================================================================

UPDATE public.api_keys
SET scopes = array_append(scopes, 'WRITE_MEDIA')
WHERE name = 'Claude-Code'
  AND NOT ('WRITE_MEDIA' = ANY(scopes));

UPDATE public.api_keys
SET scopes = array_append(scopes, 'READ_MEDIA')
WHERE name = 'Claude-Code'
  AND NOT ('READ_MEDIA' = ANY(scopes));
