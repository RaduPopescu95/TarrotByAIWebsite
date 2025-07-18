import { useRouter } from "next/router";
import CheckoutConferintaGrup from "../../client/components/checkout-conferinta-grup";

export default function CheckoutConferintaGrupPage() {
  const router = useRouter();
  const { conferintaId } = router.query;

  return (
    <>
      <CheckoutConferintaGrup conferintaId={conferintaId} />
    </>
  );
} 