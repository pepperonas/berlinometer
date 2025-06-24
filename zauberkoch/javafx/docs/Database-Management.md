# Database Management

## Delete User and Receipes

```sql
SET @uid = ?;
DELETE
FROM user_settings
WHERE user_id = @uid;
DELETE
FROM users
WHERE id = @uid;
```

## Get Users ApiLogs

```sql
SELECT *
FROM fooddb.api_logs
where user_id = ?;
```


