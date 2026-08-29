export default function AdminLoading() {
  return (
    <div className="admin-page" aria-busy="true" aria-label="Loading admin data">
      <div className="admin-loading admin-loading--heading" />
      <div className="admin-stats admin-stats--three">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="admin-loading admin-loading--card" key={index} />
        ))}
      </div>
      <div className="admin-loading admin-loading--panel" />
    </div>
  );
}
