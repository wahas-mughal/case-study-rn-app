class Realm {
  constructor(config) {
    this.schema = config.schema;
    this.tables = new Map();

    config.schema.forEach(schema => {
      this.tables.set(schema.name, new Map());
    });

    Realm.latest = this;

    if (config.onMigration) {
      config.onMigration();
    }
  }

  write(work) {
    work();
  }

  create(name, value) {
    const schema = this.schema.find(item => item.name === name);
    const table = this.tables.get(name);
    const key = value[schema.primaryKey];
    const existing = table.get(key);
    const row = existing ? Object.assign(existing, value) : { ...value };

    table.set(key, row);
    return row;
  }

  objects(name) {
    const list = [...this.tables.get(name).values()];

    list.sorted = (field, descending) =>
      [...list].sort((left, right) => {
        const leftValue =
          left[field] instanceof Date ? left[field].getTime() : left[field];
        const rightValue =
          right[field] instanceof Date ? right[field].getTime() : right[field];

        return descending ? rightValue - leftValue : leftValue - rightValue;
      });

    return list;
  }

  objectForPrimaryKey(name, key) {
    return this.tables.get(name).get(key) ?? null;
  }

  delete(row) {
    this.tables.forEach(table => {
      table.forEach((value, key) => {
        if (value === row) {
          table.delete(key);
        }
      });
    });
  }
}

Realm.UpdateMode = { Modified: 'modified' };
Realm.latest = null;

module.exports = Realm;
