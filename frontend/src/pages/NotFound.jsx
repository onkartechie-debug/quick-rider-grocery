import { Link } from 'react-router-dom';
import { MapPinOff } from 'lucide-react';
import Button from '../components/common/Button.jsx';
import { EmptyState } from '../components/common/Feedback.jsx';

export default function NotFound() {
  return (
    <EmptyState
      icon={MapPinOff}
      title="This aisle doesn't exist"
      description="The page you're looking for has moved or never existed."
      action={
        <Link to="/">
          <Button>Back to shops</Button>
        </Link>
      }
      className="mx-auto mt-10 max-w-lg"
    />
  );
}
