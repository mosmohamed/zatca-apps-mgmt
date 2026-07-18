import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { accountService } from "@/features/account/services/account-service"
import { getApiErrorMessage } from "@/features/auth/hooks/use-auth"

export function useLinkedIdentities() {
  return useQuery({
    queryKey: ["account", "identity-links"],
    queryFn: () => accountService.listLinks(),
  })
}

export function useInitiateIdentityLink() {
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (slug: string) => accountService.initiateLink(slug),
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t("account.linkFailed")))
    },
  })
}

export function useConfirmIdentityLink() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => accountService.confirmLink(code),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["account", "identity-links"] })
      toast.success(t("account.linkConfirmed"))
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, t("account.linkFailed")))
    },
  })
}
