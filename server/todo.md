Implement soft delete by admin and user
    /admin/user/disable-account
    /user/disable-account
Implement Hard delete by admin and user
    /admin/user/delete-account
    /user/delete-account

route to show users whose account have been disabled
    /admin/users/disabled-account
route to show users whose account is active
    /admin/users/active-account

admin can make the manager as admin

admin can't delete the other admin

create a owner role which can do all the things that admin can do + it can delete the admin also

set password for google logged in users
implement rate limiting and throttling 
