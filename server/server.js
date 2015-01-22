var loopback = require('loopback');
var boot = require('loopback-boot');

var app = module.exports = loopback();

setupRelations = function () {
  console.log("Loopback booted");

  Role = app.models.Role
  RoleMapping = app.models.RoleMapping
  User = app.models.User


  Role.hasMany(RoleMapping, {as: 'principals', foreignKey: 'roleId'});
  RoleMapping.belongsTo(Role);
  RoleMapping.belongsTo('principal', {polymorphic: true});

  User.hasMany(Role, { as: 'roles', through: RoleMapping, polymorphic: 'principal'});

  testRelations()
};


testRelations = function () {
  Role = app.models.Role
  RoleMapping = app.models.RoleMapping
  User = app.models.User


  User.create({username: 'joe', email: 'joe@schmoe.com', password: 'abc123'}, function (err, joeUser) {
    if (err) throw err;

    Role.create({name: 'admin', description: 'Administrator'}, function (err, adminRole) {
      if (err) throw err;

      adminRole.principals.create({
        principalType: RoleMapping.USER,
        principalId: joeUser.id
      }, function (err, mapping) {
        if (err) throw err;

        User.findOne({where: {username: 'joe'}, include: ['roles']}, function (err, user) {
          console.log("user with roles:", user);
          if (!user.roles().length) {
            console.log('Stopping');
            process.exit(1);
          }
        });
      });
    });
  });

}

cleanDatabase = function (cb) {
  Role = app.models.Role
  RoleMapping = app.models.RoleMapping
  User = app.models.User

  RoleMapping.destroyAll({}, function () {
    Role.destroyAll({}, function () {
      User.destroyAll({}, cb);
    });
  });
}

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, setupRelations);

app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    console.log('Web server listening at: %s', app.get('url'));
  });
};

// start the server if `$ node server.js`
if (require.main === module) {
  app.start();
}
