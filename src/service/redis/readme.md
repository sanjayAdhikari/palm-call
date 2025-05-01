# Redis installation guide

### install redis in mac

``brew install redis``

#### start redis server

`brew services start redis`

`redis-server`
// for background
`redis-server --daemonize yes`

#### install redis-commander to access data inside redis storage

``npm install -g redis-commander``

- start redis commander
  `redis-commander`

connect to redis

`redis-cli`

`SET foo bar`

`GET foo`

`DEL foo`

### to group multi field in 1 key

`HSET key field1 value1`

`HSET key field2 value2`

`HGET key field1`

`DEL key`

## install redis in nodejs

`npm install redis` in project directory