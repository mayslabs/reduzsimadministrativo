INSERT INTO sync_log (
  record_type, record_id, action, version, scope, changed_at, changed_by
)
SELECT
  'clients',
  id,
  'upsert',
  version + 1,
  scope,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  'user-mayssa'
FROM clients
WHERE deleted_at IS NULL
  AND trim(COALESCE(json_extract(payload, '$.nextAction'), '')) <> '';

UPDATE clients
SET
  payload = json_set(
    payload,
    '$.notes',
    json_insert(
      CASE
        WHEN json_type(payload, '$.notes') = 'array' THEN json_extract(payload, '$.notes')
        ELSE json('[]')
      END,
      '$[#]',
      json_object(
        'id', 'next-action-migration-' || id,
        'text', trim(json_extract(payload, '$.nextAction')),
        'userId', 'user-mayssa',
        'pinned', json('false'),
        'pinnedAt', NULL,
        'createdAt', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
        'updatedAt', NULL
      )
    ),
    '$.nextAction',
    ''
  ),
  version = version + 1,
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  updated_by = 'user-mayssa'
WHERE deleted_at IS NULL
  AND trim(COALESCE(json_extract(payload, '$.nextAction'), '')) <> '';
