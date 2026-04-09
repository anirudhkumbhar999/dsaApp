function PlaceholderPage({ title, description }) {
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <div className="card">
        <p className="topic-title">Planned Module</p>
        <p className="topic-meta">{description}</p>
      </div>
    </div>
  );
}

export default PlaceholderPage;
