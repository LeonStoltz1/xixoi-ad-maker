import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = 'pk_live_51SCBbgRfAZMMsSx8IR9Bi1KnF7cCDzvhzaVxJthvxn6ciBFkgoY4rCkyDldC6h7kGmB9wD7thekCE8JmslxWxrnL00wKhH83vw';

export const stripePromise = loadStripe(stripePublishableKey);
