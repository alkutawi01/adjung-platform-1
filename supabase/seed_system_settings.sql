insert into system_settings (id, academic_affiliation, editorial_policy, accent_color, allow_self_registration, role_permissions)
values (
  1,
  '',
  '',
  '',
  true,
  '{
    "Chief Editor": {
      "viewIndex": true, "viewDirectory": true, "curateFrontpage": true, "inviteWriters": true,
      "moderateReports": true, "editOthersContent": false, "manageSettings": true, "manageRbac": true,
      "manageLogs": true, "createNotice": true, "editNotice": true, "publishNotice": true,
      "archiveNotice": true, "deleteNotice": true, "createEditorNote": true, "editEditorNote": true,
      "publishEditorNote": true, "archiveEditorNote": true, "deleteEditorNote": true
    },
    "Editor": {
      "viewIndex": true, "viewDirectory": true, "curateFrontpage": true, "inviteWriters": false,
      "moderateReports": true, "editOthersContent": false, "manageSettings": false, "manageRbac": false,
      "manageLogs": false, "createNotice": true, "editNotice": true, "publishNotice": true,
      "archiveNotice": true, "deleteNotice": true, "createEditorNote": true, "editEditorNote": true,
      "publishEditorNote": true, "archiveEditorNote": true, "deleteEditorNote": true
    },
    "Writer": {
      "viewIndex": true, "viewDirectory": true, "curateFrontpage": false, "inviteWriters": false,
      "moderateReports": false, "editOthersContent": false, "manageSettings": false, "manageRbac": false,
      "manageLogs": false, "createNotice": false, "editNotice": false, "publishNotice": false,
      "archiveNotice": false, "deleteNotice": false, "createEditorNote": false, "editEditorNote": false,
      "publishEditorNote": false, "archiveEditorNote": false, "deleteEditorNote": false
    },
    "Visitor": {
      "viewIndex": false, "viewDirectory": false, "curateFrontpage": false, "inviteWriters": false,
      "moderateReports": false, "editOthersContent": false, "manageSettings": false, "manageRbac": false,
      "manageLogs": false, "createNotice": false, "editNotice": false, "publishNotice": false,
      "archiveNotice": false, "deleteNotice": false, "createEditorNote": false, "editEditorNote": false,
      "publishEditorNote": false, "archiveEditorNote": false, "deleteEditorNote": false
    }
  }'::jsonb
)
on conflict (id) do update set role_permissions = excluded.role_permissions;
