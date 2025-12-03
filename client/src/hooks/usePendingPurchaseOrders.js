import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '../api/base44Client';
import { useMemberAccess } from './useMemberAccess';

export function usePendingPurchaseOrders() {
  const queryClient = useQueryClient();
  const { memberInfo } = useMemberAccess();

  const { data: pendingPOBookings = [], isLoading, refetch } = useQuery({
    queryKey: ['pending-po-bookings', memberInfo?.id],
    queryFn: async () => {
      if (!memberInfo?.id) return [];
      
      try {
        const myBookings = await base44.entities.Booking.filter({ member_id: memberInfo.id });
        
        const pendingBookings = myBookings.filter(booking => 
          booking.po_to_follow === true && 
          (!booking.purchase_order_number || booking.purchase_order_number.trim() === '')
        );
        
        return pendingBookings;
      } catch (error) {
        console.error('[usePendingPurchaseOrders] Error fetching bookings:', error);
        return [];
      }
    },
    enabled: !!memberInfo?.id,
    staleTime: 30000,
    refetchOnMount: true,
  });

  const hasPendingPOs = pendingPOBookings.length > 0;
  const pendingPOCount = pendingPOBookings.length;

  const invalidatePendingPOs = () => {
    queryClient.invalidateQueries({ queryKey: ['pending-po-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
  };

  return {
    pendingPOBookings,
    hasPendingPOs,
    pendingPOCount,
    isLoading,
    refetch,
    invalidatePendingPOs,
  };
}
