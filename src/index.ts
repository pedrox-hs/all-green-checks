import app from './app'
import githubActions from '@probot/adapter-github-actions'

githubActions.run(app)
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
