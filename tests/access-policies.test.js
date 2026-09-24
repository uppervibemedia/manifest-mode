import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const entity=name=>JSON.parse(readFileSync(new URL(`../base44/entities/${name}.jsonc`,import.meta.url),'utf8'));
test('private training history is owner scoped and cannot be edited after a save',()=>{
 const schema=entity('TrainingSession');
 assert.deepEqual(schema.rls.read,{created_by:'{{user.email}}'});
 assert.deepEqual(schema.rls.delete,{created_by:'{{user.email}}'});
 assert.equal(schema.rls.update,false);
});
test('subscription fields cannot be directly written by an ordinary client',()=>{
 const schema=entity('UserProfile');
 for(const key of ['subscription_tier','billing_platform','renewal_date','trial_ends_at','stripe_subscription_id']) {
  assert.deepEqual(schema.properties[key].rls.write,{user_condition:{role:'admin'}});
 }
 assert.equal(schema.properties.subscription_tier.default,'free');
});
