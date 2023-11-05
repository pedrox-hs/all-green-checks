import path from 'path'
import fs from 'fs'

export function getFixturePath (fixture: string): string {
  return path.resolve(__dirname, '..', 'fixtures', fixture)
}

export function getFixture (fixture: string): string {
  return fs.readFileSync(getFixturePath(fixture)).toString()
}
