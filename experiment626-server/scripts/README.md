# Database Cleanup Utility

Utility scripts for maintaining the Experiment626 database.

## Prerequisites

Make sure you have the `DATABASE_URL` environment variable set in your `.env` file or environment.

## Available Commands

### List Users
View all users and their game association counts:
```bash
npm run cleanup:list
```

### Remove All Game Associations
Removes all game associations but keeps user accounts:
```bash
npm run cleanup:all
```

### Remove Stale Associations
Removes game associations that haven't been active in the specified number of days (default: 7):
```bash
npm run cleanup:stale        # Remove associations inactive for 7+ days
npm run cleanup:stale 14     # Remove associations inactive for 14+ days
```

### Remove Specific User
Removes a specific user and all their game associations:
```bash
npm run cleanup:user <userId>
```

Example:
```bash
npm run cleanup:user abc123xyz456
```

### Full Database Reset
**⚠️ WARNING: This is destructive and cannot be undone!**

Removes ALL users and ALL game associations:
```bash
npm run cleanup:reset
```

This command includes a 3-second delay to allow you to cancel with Ctrl+C.

## Use Cases

**Before testing:** Clean up old test data
```bash
npm run cleanup:all
```

**Weekly maintenance:** Remove old inactive games
```bash
npm run cleanup:stale 7
```

**Fresh start:** Complete database reset
```bash
npm run cleanup:reset
```

**Inspect database:** See what's currently stored
```bash
npm run cleanup:list
```

## Notes

- The cleanup utility uses Prisma to interact with the database
- All operations are logged to the console
- User deletions cascade to their game associations automatically
- Game associations are linked to Colyseus room IDs, which may no longer exist if rooms have been disposed
