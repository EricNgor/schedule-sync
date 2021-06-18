# Schedule Sync

Schedule Sync is a web application that allows people to more easily find the times that they will all be available. Users will be able to log into the site, then use the schedule setter to input the times in which they are either free or busy. They can then either create or join a group, where a table will display the times in which all group members are free.

## Installation
This project can be ran without any prior setup.

## Home Page
The home page displays any groups the users are in, as well as options to create a group, join a group, or edit their schedule.

## Schedule Input
After clicking on the 'My Schedule' button in the homepage, the user will be brought to a page with a table showing their current schedule. \
The table can be edited by clicking and dragging through cells. \
If the initial click filled a cell, then dragging the mouse through other cells will only fill them, and not clear them. The opposite happens if the initial click cleared a cell. \
There are checkboxes to select whether the user wants the displayed schedule to represent the times that they are free or if they are busy. \
This makes it much easier for users who are free more often than they are busy, and vice versa. \
Busy and free times always mirror each other, so if the user wants to start off with a filled table, they can use the clear button from the opposite display mode. \
The user can save their schedule by clicking on the 'Save Schedule' button. \
The schedule is only saved if there have been changes between button presses, in which case the text 'Schedule 
Saved!' will briefly appear.

## Group Creation and Joining
Users can click on the 'Create Group' button from the homepage to create a group, where they will be prompted to input a group name. \
To join a group, the user must receive an invite code from a user in an existing group, then input that code after clicking 'Join Group'. \
If the code is incorrect or the user is already in that group, the form will display an error message.

## Group Page
The group page displays the overlapping times that group members are free. \
There are buttons to toggle a member's inclusion in the case that an arrangement is needed to be made with only a subset of the group members. \
The color of each cell indicates the percentage of __included__ members that are free during the specified timeframe. This is decided by the following boundaries:

| % of Members Free  | Color    |
| ------------------ |:--------:|
| 100                | Green    |
| [50 - 100)         | Yellow   |
| (0 - 50)           | Red      |
| 0                  | None     |

To invite people to the group, the user can copy the invite code from the right. \
The code is hidden until hovered or selected in case the group page is being shown to anyone outside of the group. \
The user may choose to leave the group by clicking the 'Leave Group' button. \
In the case that the only person in group leaves, the group is then deleted. \
If a user that is not part of a group tries to view a group's page, they will instead be shown a message telling them that they are allowed to view the page.

# 
**This app is currently not deployed, but is planned to be soon.**
