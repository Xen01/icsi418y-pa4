# ICSI 418Y - Programming Assignment 4
**Name:** Benny Wang

## Description
A full-stack Project Management application built with React, Express, and MongoDB. This version extends PA3 by adding User Stories and Project Backlogs.

## Features
- User Signup and Login
- Create and View Projects with Project Leads
- Manage Project Members (add/remove)
- Create, View, Edit, and Delete User Stories in a Project Backlog
- Assign stories to project members
- Prevent removing a project member if they have stories assigned

## How to Run
You need two terminals open at the same time.

**Terminal 1 (Backend):**
1. cd server
2. npm install
3. npm run dev

**Terminal 2 (Frontend):**
1. cd client
2. npm install
3. npm run dev

Then open http://localhost:5173 in your browser.

## Preparing Test Data
To test the application fully, follow these steps:
1. Create at least three users (e.g., alice, bob, charlie).
2. Create two projects (Project Alpha and Project Beta).
3. Add charlie as a non-lead member to Project Alpha.
4. Go to the Project Backlog, create at least five stories across both projects.
   - Include High, Medium, and Low priorities.
   - Include stories that are Unassigned, assigned to a member, and assigned to the Lead.
   - Edit a story to change its status to In Progress or Done.
5. Try to remove charlie from Project Alpha while he has an assigned story (it should fail).
6. Reassign or delete charlie's story, then remove him from the project (it should succeed).