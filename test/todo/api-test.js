process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const chai = require('chai');
const expect = chai.expect;
const should = chai.should();
const request = require('supertest');
const config = require('../../config');
const jwt = require('jsonwebtoken');

const app = require('../../core');

// Checking for Unauthorized request
describe('GET /todo', () => {
  it('should return 401 unauthorized with properties', (done) => {
    request(app)
    .get('/todo')
    .set('Content-Type', config.app.headers.contentType)
    .then((res) => {
      const body = res.body;
      res.status.should.equal(401);
      expect(body).to.contain.property('status');
      expect(body).to.contain.property('message');
      expect(body).to.contain.property('description');
      expect(body).to.contain.property('data');
      expect(body).to.contain.property('response_tag');
      done();
    })
    .catch((err) => {
      //console.log('inside error');
      done(err);
    });
  });
});

// Attempting to get logged-in with success
describe('GET /login', () => {
  it('should login a user', (done) => {
    request(app)
    .post('/login')
    .set('Content-Type', config.app.headers.contentType)
    .send({
      "email": "parasworkspace@gmail.com",
      "password": "12345"
    })
    .end((err, res) => {
      should.not.exist(err);
      expect(res.body).to.contain.property('token');
      res.status.should.equal(200);
      res.body.token.should.be.a('string');
      done();
    })
  });
});

// Attempting to get all todos
describe('GET /todo', () => {
  const token = jwt.sign(
    {
      email: 'parasworkspace@gmail.com',
      password: '12345'
    },
    config.app.secret, (err, token) => {
      it('should return all todos with 200', (done) => {
        request(app)
        .get('/todo')
        .set('Content-Type', config.app.headers.contentType)
        .set('Authorization', 'Bearer ' + token)
        .then((res) => {
          res.status.should.equal(200);
          expect(res.body.data).to.be.a('array');
          done();
        })
        .catch((err) => {
          //console.log('inside error');
          done(err);
        });
      });
    });
});
