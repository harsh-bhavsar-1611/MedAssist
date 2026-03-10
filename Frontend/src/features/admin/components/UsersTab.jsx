import React, { useMemo } from "react";
import { CircleAlert } from "lucide-react";
import { SmallStat } from "./MetricCard";

export const UsersTab = ({
  users,
  userSummary,
  loadingUsers,
  userQuery, setUserQuery,
  userRoleFilter, setUserRoleFilter,
  userStatusFilter, setUserStatusFilter,
  userSort, setUserSort,
  userDir, setUserDir,
  userPage, setUserPage,
  userPagination,
  loadUsers,
  toggleUserFlag,
  savingUserId
}) => {
  const adminUsers = useMemo(() => users.filter((item) => item.is_staff), [users]);
  const regularUsers = useMemo(() => users.filter((item) => !item.is_staff), [users]);

  return (
    <section className="space-y-4">
      <div className="frost-panel rounded-2xl p-4 md:p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-xl font-bold">Users</h2>
          <input
            value={userQuery}
            onChange={(event) => {
              setUserPage(1);
              setUserQuery(event.target.value);
            }}
            placeholder="Search user by name/email"
            className="w-full rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm outline-none focus:border-blue-400 md:w-80"
          />
          <select
            value={userRoleFilter}
            onChange={(event) => {
              setUserPage(1);
              setUserRoleFilter(event.target.value);
            }}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admins</option>
            <option value="user">Users</option>
          </select>
          <select
            value={userStatusFilter}
            onChange={(event) => {
              setUserPage(1);
              setUserStatusFilter(event.target.value);
            }}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select
            value={userSort}
            onChange={(event) => {
              setUserPage(1);
              setUserSort(event.target.value);
            }}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm"
          >
            <option value="date_joined">Joined Date</option>
            <option value="last_login">Last Login</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="session_count">Sessions</option>
            <option value="message_count">Messages</option>
          </select>
          <select
            value={userDir}
            onChange={(event) => {
              setUserPage(1);
              setUserDir(event.target.value);
            }}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
          <button
            onClick={() => loadUsers(userQuery, userRoleFilter, userStatusFilter, userSort, userDir, userPage)}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm font-semibold"
          >
            {loadingUsers ? "Loading..." : "Search"}
          </button>
          {userQuery && (
            <button
              onClick={() => {
                setUserPage(1);
                setUserQuery("");
              }}
              className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <SmallStat label="Total Listed" value={userSummary?.total ?? users.length} />
          <SmallStat label="Admins" value={userSummary?.admins ?? adminUsers.length} />
          <SmallStat label="Users" value={userSummary?.regular_users ?? regularUsers.length} />
        </div>

        <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Admins</h3>
        <UsersTable rows={adminUsers} onToggle={toggleUserFlag} savingUserId={savingUserId} />

        <h3 className="mb-2 mt-6 text-sm font-bold uppercase tracking-[0.14em] text-slate-600">Regular Users</h3>
        <UsersTable rows={regularUsers} onToggle={toggleUserFlag} savingUserId={savingUserId} />
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            disabled={userPagination.page <= 1}
            onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-slate-600">
            Page {userPagination.page || 1} of {userPagination.total_pages || 1}
          </span>
          <button
            disabled={(userPagination.page || 1) >= (userPagination.total_pages || 1)}
            onClick={() => setUserPage((prev) => Math.min(userPagination.total_pages || 1, prev + 1))}
            className="rounded-lg border border-slate-300 bg-slate-50/80 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
};

const UsersTable = ({ rows, onToggle, savingUserId }) => {
  if (!rows.length) {
    return <p className="rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-500">No users found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/70">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-600">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Joined</th>
            <th className="px-3 py-2">Sessions</th>
            <th className="px-3 py-2">Messages</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const lockAdmin = row.is_last_active_admin;
            return (
              <tr key={row.id} className="border-b border-slate-100 align-top">
                <td className="px-3 py-2">
                  <p className="font-semibold">{row.name || "-"}</p>
                  <p className="text-xs text-slate-500">Gender: {row.gender || "n/a"}</p>
                </td>
                <td className="px-3 py-2">{row.email}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {row.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2">{row.date_joined ? new Date(row.date_joined).toLocaleDateString() : "-"}</td>
                <td className="px-3 py-2">{row.session_count ?? 0}</td>
                <td className="px-3 py-2">{row.message_count ?? 0}</td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      disabled={savingUserId === row.id || lockAdmin}
                      onClick={() => onToggle(row, "is_active", !row.is_active)}
                      className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {row.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      disabled={savingUserId === row.id || row.is_superuser || lockAdmin}
                      onClick={() => onToggle(row, "is_staff", !row.is_staff)}
                      className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {row.is_staff ? "Remove Admin" : "Make Admin"}
                    </button>
                  </div>
                  {lockAdmin && (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                      <CircleAlert className="h-3.5 w-3.5" />
                      Last active admin cannot be removed/deactivated.
                    </p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
