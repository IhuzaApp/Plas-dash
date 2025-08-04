import { useMutation } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';

interface UpdateMultAuthVariables {
  employeeId: string;
  multAuthEnabled: boolean;
}

export function useUpdateMultAuth() {
  return useMutation<
    { update_orgEmployees: { affected_rows: number } },
    Error,
    UpdateMultAuthVariables
  >({
    mutationFn: async ({ employeeId, multAuthEnabled }) => {
      console.log('UpdateMultAuth Debug:', { employeeId, multAuthEnabled });

      const mutation = `
        mutation UpdateMultAuth($employeeId: uuid!, $multAuthEnabled: Boolean!) {
          update_orgEmployees(
            where: { id: { _eq: $employeeId } },
            _set: { multAuthEnabled: $multAuthEnabled }
          ) {
            affected_rows
          }
        }
      `;

      try {
        const result = await hasuraRequest(mutation, { employeeId, multAuthEnabled });
        console.log('UpdateMultAuth Result:', result);
        return result as { update_orgEmployees: { affected_rows: number } };
      } catch (error) {
        console.error('UpdateMultAuth Error:', error);
        throw error;
      }
    },
  });
}
